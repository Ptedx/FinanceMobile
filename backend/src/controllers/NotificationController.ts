import OpenAI from 'openai';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { BANK_PARSER_SYSTEM_PROMPT } from '../utils/prompts';

const prisma = new PrismaClient();

// Configuração DeepSeek (usando SDK OpenAI)
const deepseek = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY // Coloque no .env
});

export const handleNotificationWebhook = async (req: Request, res: Response) => {
  const { rawText, timestamp } = req.body;
  
  // Use user ID from the authenticated request
  // Cast to specific type if needed, or use 'any' if AuthRequest type isn't exported perfectly here
  const userId = (req as any).user?.userId;

  if (!userId) {
       return res.status(401).json({ error: 'Unauthorized: No user ID found.' });
  }

  // No longer need to fetch first user or use hardcoded ID
  const finalUserId = userId;

  try {
    // 1. Chama a IA
    const completion = await deepseek.chat.completions.create({
      messages: [
        { role: "system", content: BANK_PARSER_SYSTEM_PROMPT },
        { role: "user", content: `Data Atual: ${new Date().toISOString()}\nTexto: ${rawText}` }
      ],
      model: "deepseek-chat",
      temperature: 0.1, // Temperatura baixa para precisão
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    // 2. Processa o resultado
    if (!result.isValid || result.type === 'IGNORE') {
      return res.status(200).json({ message: 'Notificação ignorada/irrelevante', data: result });
    }

    // 3. Salva no Banco de Dados
    let savedTransaction;
    if (result.type === 'EXPENSE') {
      savedTransaction = await prisma.expense.create({
        data: {
          value: result.amount,
          description: result.description, 
          category: result.category,
          date: result.date ? new Date(result.date) : new Date(timestamp),
          paymentMethod: result.paymentMethod,
          isRecurring: false,
          userId: finalUserId
        }
      });
    } else if (result.type === 'INCOME') {
      savedTransaction = await prisma.income.create({
        data: {
          value: result.amount,
          category: result.category,
          // income doesn't have paymentMethod in the schema provided in prompts, assuming default or simple income
          date: result.date ? new Date(result.date) : new Date(timestamp),
          isRecurring: false,
          userId: finalUserId
        }
      });
    }

    return res.status(201).json({ success: true, transaction: savedTransaction });

  } catch (error) {
    console.error("Erro no processamento da notificação:", error);
    return res.status(500).json({ error: 'Internal Processing Error' });
  }
};
