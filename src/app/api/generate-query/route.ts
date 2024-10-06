import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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
    const { question } = await request.json() as { question: string };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: `You are a helpful assistant that generates SQL queries based on user questions. Use the following schema:\n${schema}\nOnly respond with the SQL query, no other text or code formatting.` },
        { role: "user", content: question }
      ],
    });

    const query = completion.choices[0]?.message.content?.trim() ?? '';

    return NextResponse.json({ query });
  } catch (error) {
    console.error('Error generating query:', error);
    return NextResponse.json({ error: 'Failed to generate query' }, { status: 500 });
  }
}
