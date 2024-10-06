import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { query } from "@/database/query";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const schema = `
Users (id, username, email, password_hash, first_name, last_name, address, phone_number, created_at)
Categories (id, category_id, name, description)
Products (id, product_id, name, description, price, category_id, image_url, created_at)
Orders (order_id, user_id, order_date, total_amount, status)
OrderItems (order_item_id, order_id, product_id, quantity, price)
Reviews (review_id, user_id, product_id, rating, review_text, created_at)
Carts (cart_id, user_id, product_id, quantity)
Payments (payment_id, order_id, payment_date, payment_amount, payment_status)
Inventory (inventory_id, product_id, quantity)
`;

export async function POST(request: Request) {
  try {
    const { messages: requestMessages } = await request.json() as { messages: Array<{ role: string; content: string }> };

    const systemMessage = {
      role: "system",
      content: `You are a helpful assistant that can query a database and provide insights in a friendly tone. Use the following schema:\n${schema}\nIf you need to query the database, use the format: [SQL]your query here[/SQL]. I will execute the query and provide the results with detailed explanations.`
    };

    const messages = [
      systemMessage,
      ...requestMessages.map(msg => ({ ...msg, name: msg.role }))
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[]
    });

    let assistantResponse = completion.choices[0]?.message?.content ?? '';

    const sqlRegex = /\[SQL\]([\s\S]*?)\[\/SQL\]/;
    const sqlQuery = sqlRegex.exec(assistantResponse)?.[1]?.trim();
    if (sqlQuery) {
      try {
        const queryResult = await query(sqlQuery);
        const formattedResult = JSON.stringify(queryResult.rows, null, 2);
        assistantResponse = assistantResponse.replace(
          sqlRegex.exec(assistantResponse)?.[0] ?? '',
          `Here is the query I used:\n\n${sqlQuery}\n\nAnd here are the results:\n\n${formattedResult}`
        );
      } catch (error) {
        console.error('Error executing SQL query:', error);
        assistantResponse = assistantResponse.replace(
          sqlRegex.exec(assistantResponse)?.[0] ?? '',
          `I encountered an error while executing the query: ${(error as Error).message}`
        );
      }
    }

    return NextResponse.json({ response: assistantResponse });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Failed to process chat request' }, { status: 500 });
  }
}
