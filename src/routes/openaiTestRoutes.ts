import { Router } from "express";
import { testApiKey, testChatCompletion } from "../controllers/openaiTestController";

const router = Router();

/**
 * @route   GET /api/v1/openai-test
 * @desc    Test if OpenAI API key is valid (lightweight test)
 * @access  Public
 */
router.get("/", testApiKey);

/**
 * @route   GET /api/v1/openai-test/chat
 * @desc    Test OpenAI API key with a chat completion request
 * @access  Public
 */
router.get("/chat", testChatCompletion);

export default router;

