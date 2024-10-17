import { SupabaseHybridSearch } from "@langchain/community/retrievers/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import { convertToCoreMessages, Message, streamText } from "ai";

import { customModel } from "@/ai";
import { auth } from "@/app/(auth)/auth";
import { deleteChatById, getChatById, saveChat } from "@/db/queries";

const getContext = async (message: string) => {
  const client = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PRIVATE_KEY!
  );

  const embeddings = new OpenAIEmbeddings();

  const retriever = new SupabaseHybridSearch(embeddings, {
    client,
    similarityK: 2,
    keywordK: 2,
    tableName: "documents",
    similarityQueryName: "match_documents",
    keywordQueryName: "kw_match_documents",
  });

  const results = await retriever.invoke(message);

  return results;
};

export async function POST(request: Request) {
  const { id, messages }: { id: string; messages: Array<Message> } =
    await request.json();

  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }


  const coreMessages = convertToCoreMessages(messages);

  const context = (await getContext(coreMessages[coreMessages.length - 1].content as string)).map(e => e.pageContent).join(', ')

  const result = await streamText({
    model: customModel,
    system:
      // "You are a highly knowledgeable real estate assistant for properties in France. Your role is to help users find properties, provide real estate market data, and assist with legal and financial questions related to purchasing, renting, or selling homes. You should respond in a professional, helpful, and polite manner, using conversational language. Answer questions in French unless specified otherwise. Always offer clear and concise information about properties, market trends, tax regulations, and local real estate procedures.",
      `You are a helpful and knowledgeable assistant that answers user queries strictly within the context: "${context}". Focus only on the information and guidelines specified by this context. Avoid unrelated content. Your responses should be concise, accurate, and directly relevant to the context provided. If the user asks for information beyond the specified context, politely guide them back to the context or clarify that you are restricted to discussing topics within the context. Maintain a professional tone and clear structure in your answers.`,
    messages: coreMessages,
    maxSteps: 5,
    onFinish: async ({ responseMessages }) => {
      if (session.user && session.user.id) {
        try {
          await saveChat({
            id,
            messages: [...coreMessages, ...responseMessages],
            userId: session.user.id,
          });
        } catch (error) {
          console.error("Failed to save chat");
        }
      }
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: "stream-text",
    },
  });

  return result.toDataStreamResponse({});
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    await deleteChatById({ id });

    return new Response("Chat deleted", { status: 200 });
  } catch (error) {
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}
