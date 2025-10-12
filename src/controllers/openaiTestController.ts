import { Request, Response } from "express";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.api_key,
});

/**
 * Test endpoint to verify OpenAI API key is valid
 * Makes a simple API call to check connectivity and authentication
 */
export const testApiKey = async (req: Request, res: Response) => {
  try {
    // Check if API key exists
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: "API key not found in environment variables",
        message: "Please set the 'api_key' environment variable",
      });
    }

    // Make a simple API call to test the key
    // Using the models list endpoint as it's lightweight and fast
    const models = await openai.models.list();
    
    // If we get here, the API key is valid
    return res.status(200).json({
      success: true,
      message: "OpenAI API key is valid and working!",
      apiKeyPrefix: process.env.OPENAI_API_KEY.substring(0, 10) + "...",
      modelsAvailable: models.data.length,
    });

  } catch (error: any) {
    // Handle different types of errors
    if (error.status === 401) {
      return res.status(401).json({
        success: false,
        error: "Invalid API key",
        message: "The provided OpenAI API key is invalid or unauthorized",
        details: error.message,
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        success: false,
        error: "Rate limit exceeded",
        message: "Too many requests to OpenAI API",
        details: error.message,
      });
    }

    // Generic error handling
    return res.status(500).json({
      success: false,
      error: "Error testing API key",
      message: error.message || "An unexpected error occurred",
      details: error.toString(),
    });
  }
};

/**
 * Test endpoint with a simple chat completion
 * This provides a more thorough test of the API key
 */
export const testChatCompletion = async (req: Request, res: Response) => {
  try {
    // Check if API key exists
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: "API key not found in environment variables",
        message: "Please set the 'api_key' environment variable",
      });
    }

    // Make a simple chat completion request
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Say 'API key is working!' in a fun way",
        },
      ],
      max_tokens: 50,
    });

    return res.status(200).json({
      success: true,
      message: "OpenAI API key is valid and chat completions are working!",
      apiKeyPrefix: process.env.OPENAI_API_KEY.substring(0, 10) + "...",
      response: completion.choices[0].message.content,
      model: completion.model,
      usage: completion.usage,
    });

  } catch (error: any) {
    // Handle different types of errors
    if (error.status === 401) {
      return res.status(401).json({
        success: false,
        error: "Invalid API key",
        message: "The provided OpenAI API key is invalid or unauthorized",
        details: error.message,
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        success: false,
        error: "Rate limit exceeded",
        message: "Too many requests to OpenAI API",
        details: error.message,
      });
    }

    if (error.status === 403) {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
        message: "Your API key doesn't have access to this resource",
        details: error.message,
      });
    }

    // Generic error handling
    return res.status(500).json({
      success: false,
      error: "Error testing chat completion",
      message: error.message || "An unexpected error occurred",
      details: error.toString(),
    });
  }
};

