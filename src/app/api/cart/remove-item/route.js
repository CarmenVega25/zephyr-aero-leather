import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL = `${process.env.WOOCOMMERCE_API_URL}/wp-json/wc/v3/cart/remove`;

export async function POST(req) {
  try {
    const { productId } = await req.json();
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const removeItemResponse = await fetch(API_BASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: productId }),
    });

    if (!removeItemResponse.ok) throw new Error("Failed to remove item from cart");

    const updatedCart = await removeItemResponse.json();
    return NextResponse.json(updatedCart);
  } catch (error) {
    console.error("Error removing item from cart:", error.message);
    return NextResponse.json({ error: "Failed to remove item" }, { status: 500 });
  }
}
