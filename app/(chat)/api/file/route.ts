import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import { getEncoding } from "js-tiktoken";
import { NextResponse } from "next/server";

import json from '@/public/docs/Code_general_des_impots_corrected.json';

import type { Document } from "@langchain/core/documents";

interface Json {
    articles: { titre: string, chapitre: string, section: string, article_number: string, content: string }[];
}

export async function POST() {
    const embeddings = new OpenAIEmbeddings({
        model: "text-embedding-3-small",
    });

    const supabaseClient = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_PRIVATE_KEY!
    );

    const vectorStore = new SupabaseVectorStore(embeddings, {
        client: supabaseClient,
        tableName: "documents",
        queryName: "match_documents",
    });

    const jsonFile: Json = json as Json;
    const enc = getEncoding("cl100k_base");
    const docs: Document[] = [];
    const MAX_TOKENS: number = 8000;

    jsonFile.articles.map((doc, id) => {
        const tokens = enc.encode(doc.content);

        if (tokens.length > MAX_TOKENS) {
            // Chunking logic
            for (let i = 0; i < tokens.length; i += MAX_TOKENS) {
                const chunkTokens = tokens.slice(i, i + MAX_TOKENS);  // Slice tokens into chunks
                const chunkContent = enc.decode(chunkTokens);  // Decode chunk back to text

                docs.push({
                    id: `${id}${i / MAX_TOKENS}${(Math.random() * 1000).toFixed(0)}`,  // Unique ID for each chunk
                    metadata: {
                        titre: doc.titre,
                        chapitre: doc.chapitre,
                        section: doc.section,
                        article_number: doc.article_number,
                    },
                    pageContent: chunkContent  // Use the decoded chunk content
                });
            }
        } else {
            // If the content fits within the token limit, add it directly
            docs.push({
                id: id.toString(),
                metadata: {
                    titre: doc.titre,
                    chapitre: doc.chapitre,
                    section: doc.section,
                    article_number: doc.article_number,
                },
                pageContent: doc.content  // Directly use the original content
            });
        }
    });

    const ids: string[] = docs.map(doc => doc.id as string);  // Collect IDs from the documents

    await vectorStore.addDocuments(docs, { ids: ids });

    return NextResponse.json({ status_code: 200, message: "Embeddings saved successfully!" });
}
