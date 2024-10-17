import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import type { Document } from "@langchain/core/documents";

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

    const loader = new PDFLoader("./public/docs/example.pdf", {
        parsedItemSeparator: "",
    });

    const docs: Document[] = await loader.load();
    const ids: string[] = [];
    docs.map((_, id) => ids.push(id.toString()))

    await vectorStore.addDocuments(docs, { ids: ids })
    return NextResponse.json({ status_code: 200, message: "Embeddings saved successfully!" })

}