import { openai } from "@ai-sdk/openai";
import { SupabaseHybridSearch } from "@langchain/community/retrievers/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import { convertToCoreMessages, Message, streamText, generateText } from "ai";

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
    similarityK: 3,
    keywordK: 0,
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

  const { text } = await generateText({
    model: openai('gpt-4'),
    system: `Generate a precise and highly relevant question that pertains to French law, ensuring it incorporates any numerical details from the user's input. This question will be used in a similarity search with French law documents, so it must be accurate and reflect key concepts, statutes, or principles of French law. Return only the generated question.`,
    prompt: coreMessages[coreMessages.length - 1].content as string
  })

  const context = (await getContext(text))

  const systemPrompt = `Voici la version modifiée de votre texte pour ignorer les métadonnées si aucune réponse ne peut être trouvée dans le contexte :
  ---
  Vous êtes un assistant utile et compétent qui répond aux questions des utilisateurs en vous basant uniquement sur le contenu des objets fournis dans le tableau de contexte : ${JSON.stringify(context)}. Chaque objet de ce tableau contient une propriété "pageContent" avec des informations pertinentes et une propriété "metadata" avec des détails supplémentaires.  
  Répondez en français, sauf si l'utilisateur demande explicitement une autre langue. Concentrez-vous uniquement sur les informations fournies dans le "pageContent" de chaque objet de contexte. Vos réponses doivent être concises, précises et directement pertinentes par rapport au contexte donné.  
  IMPORTANT : Pour CHAQUE réponse, vous DEVEZ suivre ces étapes :  
  1. Répondez à la question en vous basant uniquement sur le contenu du "pageContent" des objets de contexte pertinents.
  2. Après votre réponse, sur une nouvelle ligne, pour CHAQUE objet de contexte que vous avez utilisé, incluez la structure suivante en extrayant EXACTEMENT les informations de l'objet metadata correspondant :
    - [Valeur exacte de context.metadata.titre]  
    - [Valeur exacte de context.metadata.chapitre]  
    - [Valeur exacte de context.metadata.section]  
    - [Valeur exacte de context.metadata.article_number]  
    Ces métadonnées DOIVENT être extraites EXACTEMENT du MÊME objet que le pageContent auquel vous avez fait référence dans votre réponse. N'inventez pas ou ne modifiez pas ces informations. Si une propriété n'est pas présente dans l'objet metadata, laissez sa ligne vide mais gardez le tiret.
  **Si aucune information pertinente ne peut être trouvée dans le "pageContent", ignorez l'étape des métadonnées et informez l'utilisateur que vous ne pouvez pas répondre à la question.**`;

  const result = await streamText({
    model: customModel,
    system: systemPrompt,
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
