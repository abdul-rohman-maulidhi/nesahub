"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

import { useConversations } from "@/stores/conversations";
import { useSocket } from "@/providers/socket-provider";

import { addToast } from "@heroui/toast";
import { Input } from "@heroui/input";
import { Search } from "lucide-react";
import { Spinner } from "@heroui/spinner";

import { ChatCard } from "./chat-card";
import type { Message } from "@/types/conversation";

export const ChatList = ({ className = "" }: { className?: string }) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const { conversations, setConversations } = useConversations();
  const { on } = useSocket();

  useEffect(() => {
    const getConversations = async () => {
      try {
        setLoading(true);
        const result = await axios.get("/api/conversations");
        setConversations(result.data.data);
      } catch (error) {
        addToast({
          description: "Failed getting conversations",
          color: "danger",
        });
      } finally {
        setLoading(false);
      }
    };

    getConversations();
  }, [setConversations]);

  useEffect(() => {
    const handleIncomingMessage = (payload: {
      message: Message;
      conversation: any;
    }) => {
      const { message, conversation } = payload;

      setConversations((prev) => {
        const existingIndex = prev.findIndex((c) => c.id === conversation.id);

        if (existingIndex === -1) {
          return [
            {
              ...conversation,
              messages: [message],
              updated_at: new Date().toISOString(),
            },
            ...prev,
          ];
        }

        const updated = [...prev];
        const existingConv = updated[existingIndex];

        const messageExists = existingConv.messages.some(
          (msg) => msg.id === message.id
        );
        if (!messageExists) {
          updated[existingIndex] = {
            ...existingConv,
            messages: [message, ...existingConv.messages],
            updated_at: new Date().toISOString(),
          };
        }

        return updated.sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      });
    };

    on("incoming-message", handleIncomingMessage);
  }, [on, setConversations]);

  return (
    <div
      className={`flex flex-col gap-4 w-full lg:w-2/5 lg:border-l lg:border-foreground-100 pb-[72px] lg:pb-0 p-4 ${className}`}
    >
      <h4 className="font-semibold text-xl">Messages</h4>

      <Input
        radius="full"
        placeholder="Search messages"
        variant="bordered"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        startContent={<Search size={16} />}
      />

      {loading && <Spinner className="py-4" />}

      {!loading &&
        conversations
          .filter((conversation) => {
            const otherParticipant = conversation.participants.find(
              (p) => p.user.username !== user?.username
            );

            if (!otherParticipant) return false;

            const fullName = `${otherParticipant.user.first_name} ${otherParticipant.user.last_name}`;
            const username = otherParticipant.user.username;

            return (
              fullName.toLowerCase().includes(search.toLowerCase()) ||
              username.toLowerCase().includes(search.toLowerCase())
            );
          })
          .map((conversation) => {
            const otherParticipant = conversation.participants.find(
              (p) => p.user.username !== user?.username
            );

            if (!otherParticipant) return null;

            return (
              <ChatCard
                key={conversation.id}
                conversation={conversation}
                otherParticipant={otherParticipant}
              />
            );
          })}
    </div>
  );
};
