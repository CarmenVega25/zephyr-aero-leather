"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserCart();
    } else {
      loadGuestCart();
    }
  }, [isAuthenticated]);

  const loadGuestCart = () => {
    const savedCart = JSON.parse(localStorage.getItem("guestCart")) || [];
    setCartItems(savedCart);
  };

  const saveGuestCart = (updatedCart) => {
    setCartItems(updatedCart);
    localStorage.setItem("guestCart", JSON.stringify(updatedCart));
  };

  const fetchUserCart = async () => {
    try {
      const response = await fetch("/api/cart");
      if (!response.ok) throw new Error("Failed to fetch cart");

      const data = await response.json();
      setCartItems(data.items || []);
    } catch (error) {
      console.error("Error fetching cart:", error.message);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    if (isAuthenticated) {
      try {
        const response = await fetch("/api/cart/add-item", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity }),
        });

        if (!response.ok) throw new Error("Failed to add item to cart");

        const data = await response.json();
        setCartItems(data.items);
      } catch (error) {
        console.error("Error adding to cart: ", error.message);
      }
    } else {
      const updatedCart = [...cartItems];
      const itemIndex = updatedCart.findIndex((item) => item.id === productId);

      if (itemIndex > -1) {
        updatedCart[itemIndex].quantity += quantity;
      } else {
        updatedCart.push({ id: productId, quantity });
      }

      saveGuestCart(updatedCart);
    }
  };

  const removeFromCart = async (productId) => {
    if (isAuthenticated) {
      try {
        const response = await fetch("/api/cart/remove-item", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
  
        if (!response.ok) throw new Error("Failed to remove item from cart");
  
        const data = await response.json();
        setCartItems(data.items);
      } catch (error) {
        console.error("Error removing from cart:", error.message);
      }
    } else {
      const updatedCart = cartItems.filter((item) => item.id !== productId);
      saveGuestCart(updatedCart);
    }
  };
  

  const updateQuantity = async (productId, quantity) => {
    if (isAuthenticated) {
      try {
        const response = await fetch("/api/cart/update-item", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity }),
        });

        if (!response.ok) throw new Error("Failed to update cart quantity");

        const data = await response.json();
        setCartItems(data.items);
      } catch (error) {
        console.error("Error updating cart:", error.message);
      }
    } else {
      const updatedCart = cartItems.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      );
      saveGuestCart(updatedCart);
    }
  };

  const syncGuestCartToWooCommerce = async () => {
    if (isAuthenticated) {
      const guestCart = JSON.parse(localStorage.getItem("guestCart")) || [];
      for (let item of guestCart) {
        await addToCart(item.id, item.quantity);
      }
      localStorage.removeItem("guestCart");
    }
  };

  useEffect(() => {
    syncGuestCartToWooCommerce();
  }, [isAuthenticated]);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
