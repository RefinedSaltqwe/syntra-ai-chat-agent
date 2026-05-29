"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useReactFlow } from "@xyflow/react";

interface UserApprovalSettingsProps {
    id: string;
    data: Record<string, unknown>;
}

export const UserApprovalSetting = ({
    id,
    data,
}: UserApprovalSettingsProps) => {
    const { updateNodeData } = useReactFlow();
    const name = (data?.name as string) || "User approval";
    const message = (data?.message as string) || "";

    const handleUpdateName = (value: string) => {
        updateNodeData(id, {
            name: value,
        });
    };

    const handleUpdateMessage = (value: string) => {
        updateNodeData(id, {
            message: value,
        });
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name" className="text-sm">
                    Name
                </Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => handleUpdateName(e.target.value)}
                    placeholder="User approval"
                    className="bg-muted/50"
                />
            </div>

            <div className="space-y-2 mb-1">
                <Label htmlFor="message" className="text-sm">
                    Message
                </Label>
                <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => handleUpdateMessage(e.target.value)}
                    placeholder="Does this work for you?"
                    rows={3}
                    className="bg-muted/50 resize-none"
                />
            </div>
        </div>
    );
};
