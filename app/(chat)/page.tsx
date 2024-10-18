import { Chat } from "@/components/custom/chat";
import { generateUUID } from "@/lib/utils";

import { ParseCTA } from "./ParseBTN";

export default async function Page() {
  const id = generateUUID();
  return <Chat key={id} id={id} initialMessages={[]} />;
  // return <ParseCTA />
}
