"use client";

import { defaultItems, shopItems } from "@/items";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Garage() {
  const [items, setItems] = useState(defaultItems);

  const [money, setMoney] = useState(0);

  useEffect(() => {
    // localStorage.removeItem("inventory");
    const storedMoney = localStorage.getItem("money");
    setMoney(parseInt(storedMoney || "0", 10));
    // Try to load inventory from localStorage
    const storedItems = localStorage.getItem("inventory");

    if (storedItems) {
      setItems(JSON.parse(storedItems));
    } else {
      // If nothing is stored, save defaults
      localStorage.setItem("inventory", JSON.stringify(defaultItems));
      setItems(defaultItems);
    }
  }, []);

  // Patikrinti ar item priklauso useriui
  const isOwned = (id: number) => {
    return items.some((it) => it.id === id && it.isOwned);
  };

  const buyItem = (item: any) => {
    if (money < item.price) {
      alert("Not enough money!");
      return;
    }

    // update inventory
    const updatedItems = [...items, { ...item, isOwned: true }];
    setItems(updatedItems);
    localStorage.setItem("inventory", JSON.stringify(updatedItems));

    // update money
    const newMoney = money - item.price;
    setMoney(newMoney);
    localStorage.setItem("money", newMoney.toString());
  };

  const getEquippedId = () => {
    const eq = items.find((it) => it.isEquipped);
    return eq ? eq.id : null;
  };

  const equipItem = (id: number) => {
    const updatedItems = items.map((it) => ({
      ...it,
      isEquipped: it.id === id, // tik pasirinktą padarom equipped
    }));
    setItems(updatedItems);
    localStorage.setItem("inventory", JSON.stringify(updatedItems));
  };

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-2 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold">Garage</h1>
        <div className="flex flex-row  gap-1">
          <button
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => (window.location.href = "/game")}
          >
            Start Game
          </button>
        </div>

        <div className=" z-50 bg-white/90 backdrop-blur-sm py-6 rounded-lg text-left">
          <h2 className="text-2xl mb-4">Your money: {money}</h2>
          <div className="flex flex-col gap-1">
            <hr />
            <h3 className="text-xl mb-4 font-semibold">Your Inventory:</h3>
            <ul className="inventory flex gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {items.map((item) => {
                const equippedId = getEquippedId();
                const isEquipped = equippedId === item.id;
                return (
                  <li key={item.id} className="mb-2">
                    <Image
                      width={200}
                      height={200}
                      src={item.imageUrl}
                      alt={item.name}
                      unoptimized
                    />
                    <strong>{item.name}</strong> - {item.description}{" "}
                    {item.isOwned ? "(Owned)" : `(Price: ${item.price})`}
                    {isEquipped ? (
                      <p className="text-green-600 font-semibold">Equipped</p>
                    ) : (
                      <button
                        className="bg-yellow-500 text-white px-3 py-1 rounded mt-2"
                        onClick={() => equipItem(item.id)}
                      >
                        Equip
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
            <hr />
            <h3 className="text-xl mb-4 font-semibold">Shop:</h3>

            <ul className="shop flex gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {shopItems.map((item) => {
                const owned = isOwned(item.id);

                return (
                  <li key={item.id} className="mb-2">
                    <Image
                      width={200}
                      height={200}
                      src={item.imageUrl}
                      alt={item.name}
                      unoptimized
                    />
                    <strong>{item.name}</strong> - {item.description}{" "}
                    {owned ? (
                      <p className="text-green-600 font-semibold">Owned</p>
                    ) : (
                      <button
                        className="bg-blue-500 text-white px-3 py-1 rounded mt-2"
                        onClick={() => buyItem(item)}
                      >
                        Buy for ${item.price}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center"></footer>
    </div>
  );
}
