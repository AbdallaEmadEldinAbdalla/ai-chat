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
    similarityK: 1,
    keywordK: 1,
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

  const context = (await getContext(coreMessages[coreMessages.length - 1].content as string))

  const systemPrompt = `Vous êtes un assistant utile et compétent qui répond aux questions des utilisateurs en vous basant uniquement sur le contenu des objets fournis dans le tableau de contexte : ${JSON.stringify(context)}. Chaque objet de ce tableau contient une propriété "pageContent" avec des informations pertinentes et une propriété "metadata" avec des détails supplémentaires.

Répondez en français, sauf si l'utilisateur demande explicitement une autre langue. Concentrez-vous uniquement sur les informations fournies dans le "pageContent" de chaque objet de contexte. Vos réponses doivent être concises, précises et directement pertinentes par rapport au contexte donné.

IMPORTANT : Pour CHAQUE réponse, vous DEVEZ suivre ces étapes :

1. Répondez à la question en vous basant uniquement sur le contenu du "pageContent" des objets de contexte pertinents.
2. Après votre réponse, sur une nouvelle ligne, pour CHAQUE objet de contexte que vous avez utilisé, incluez la structure suivante en extrayant EXACTEMENT les informations de l'objet metadata correspondant :

- [Valeur exacte de context.metadata.titre]
- [Valeur exacte de context.metadata.chapitre]
- [Valeur exacte de context.metadata.section]
- [Valeur exacte de context.metadata.article_number]

Ces métadonnées DOIVENT être extraites EXACTEMENT du MÊME objet que le pageContent auquel vous avez fait référence dans votre réponse. N'inventez pas ou ne modifiez pas ces informations. Si une propriété n'est pas présente dans l'objet metadata, laissez sa ligne vide mais gardez le tiret.

Exemple de format (basé sur les valeurs réelles de l'objet metadata) :
[Votre réponse ici basée sur le pageContent de l'objet de contexte]

- Titre premier : Impôts directs et taxes assimilées (Articles 1 A à 248 G)
- Chapitre premier : Impôt sur le revenu (Articles 1 A à 204 N)
- Section II : Revenus imposables (Articles 12 à 168)
- Article 39 sexies

Maintenez un ton professionnel et une structure claire dans vos réponses. Si l'utilisateur pose une question qui dépasse le contexte spécifié, redirigez-le poliment vers les informations disponibles ou précisez que vous êtes limité à discuter des sujets dans le contexte fourni.`;
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
