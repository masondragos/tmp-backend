interface PaginationOptions {
  page?: string;
  limit?: string;
  maxLimit?: number;
  defaultLimit?: number;
}

interface PaginationConfig {
  pagination?: PaginationOptions;
  search?: SearchOptions;
  orderBy?: any;
  select?: any;
  where?: any;
  include?: any;
}

interface PaginationResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

interface SearchOptions {
  search?: string;
  searchFields?: string[];
}

class PaginationService {
  /**
   * Parse and validate pagination parameters
   */
  static parsePaginationParams(options: PaginationOptions = {}) {
    const {
      page = '1',
      limit = '10',
      maxLimit = 50,
      defaultLimit = 10
    } = options;

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.min(maxLimit, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * pageSize;

    return {
      page: pageNum,
      limit: pageSize,
      skip,
      take: pageSize
    };
  }

  /**
   * Create search where clause for Prisma
   */
  static createSearchWhere(searchOptions: SearchOptions = {}) {
    const { search, searchFields = [] } = searchOptions;
    
    if (!search || searchFields.length === 0) {
      return {};
    }

    return {
      OR: searchFields.map(field => ({
        [field]: { contains: search, mode: 'insensitive' as const }
      }))
    };
  }

  /**
   * Create pagination response
   */
  static createResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
  ): PaginationResult<T> {
    return {
      data,
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Generic pagination function for Prisma queries
   */
  static async paginate<T>(
    prismaQuery: {
      findMany: (args: any) => Promise<T[]>;
      count: (args: any) => Promise<number>;
    },
    req: any,
    options: PaginationConfig = {}
  ): Promise<PaginationResult<T>> {
    const {
      pagination = {},
      search = {},
      orderBy = { created_at: 'desc' },
      select,
      include,
      where: additionalWhere = {}
    } = options;

    // Parse pagination parameters
    const { page, limit, skip, take } = this.parsePaginationParams(pagination);

    // Create search where clause
    const searchWhere = this.createSearchWhere(search);

    // Combine all where conditions
    const where = {
      ...additionalWhere,
      ...searchWhere
    };

    // Execute queries in parallel
    const [total, data] = await Promise.all([
      prismaQuery.count({ where }),
      prismaQuery.findMany({
        where,
        orderBy,
        skip,
        take,
        ...(select && { select }),
        ...(include && { include })
      })
    ]);

    return this.createResponse(data, total, page, limit);
  }
}

/**
 * Express middleware to extract pagination parameters
 */
export const paginationMiddleware = (options: PaginationOptions = {}) => {
  return (req: any, res: any, next: any) => {
    const pagination = PaginationService.parsePaginationParams({
      page: req.query.page,
      limit: req.query.limit,
      ...options
    });
    
    req.pagination = pagination;
    next();
  };
};

/**
 * Helper function to create paginated response
 */
export const createPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> => {
  return PaginationService.createResponse(data, total, page, limit);
};

/**
 * Helper function to create search where clause
 */
export const createSearchWhere = (searchOptions: SearchOptions) => {
  return PaginationService.createSearchWhere(searchOptions);
};

export { PaginationService };
export type { PaginationResult, PaginationOptions, SearchOptions, PaginationConfig };
