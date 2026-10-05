"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, CheckCircle2, Lock, ThumbsUp, ThumbsDown, ArrowRight, Zap } from "lucide-react";
import { Proposal } from "../../lib/ventrionClient";
import { TOTAL_SHARES, QUORUM_VOTES_REQUIRED } from "../../lib/constants";

interface ProposalCardProps {
  proposal: Proposal;
  userShares: number;
  onVote: (proposalId: number, approve: boolean) => void;
  onExecute: (proposalId: number) => void;
}

export function ProposalCard({
  proposal,
  userShares = 50_000,
  onVote,
  onExecute,
}: ProposalCardProps) {
  const [hasVoted, setHasVoted] = useState(false);

  const votesForPercent = (proposal.votesFor / TOTAL_SHARES) * 100;
  const quorumPercent = (QUORUM_VOTES_REQUIRED / TOTAL_SHARES) * 100; // 51.0%
  const isQuorumReached = proposal.votesFor >= QUORUM_VOTES_REQUIRED;

  const handleVote = (approve: boolean) => {
    onVote(proposal.id, approve);
    setHasVoted(true);
  };

  return (
    <div className="w-full bg-white/60 backdrop-blur-xl border border-white/85 rounded-2xl p-6 shadow-porcelain">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.06] pb-4">
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 rounded-full bg-black/5 text-obsidian text-xs font-mono font-bold">
            #{proposal.id}
          </span>
          <h3 className="text-base font-bold text-obsidian tracking-tight">
            {proposal.title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {proposal.executed ? (
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Executed On-Chain
            </span>
          ) : isQuorumReached ? (
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              51% Quorum Reached!
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-600 text-xs font-medium flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
              Protected by 51% Quorum
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="mt-3 text-xs sm:text-sm text-slateText/85 leading-relaxed">
        {proposal.description}
      </p>

      {/* 51% Anti-Rugpull Quorum Progress Bar */}
      <div className="mt-5 p-4 rounded-xl bg-white/70 border border-white/90">
        <div className="flex justify-between items-center text-xs font-medium text-slateText">
          <span>
            Votes For: <strong className="text-obsidian font-mono">{proposal.votesFor.toLocaleString()}</strong> / 1,000,000 ({votesForPercent.toFixed(1)}%)
          </span>
          <span className="text-emerald-700 font-semibold font-mono">
            Quorum Required: 510,000 (51.0%)
          </span>
        </div>

        {/* Progress Track */}
        <div className="relative mt-2 h-4 w-full bg-black/[0.06] rounded-full overflow-hidden">
          {/* Approved bar */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(votesForPercent, 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full ${
              isQuorumReached ? "bg-emerald-500" : "bg-peach-500"
            }`}
          />

          {/* 51% Threshold Marker Needle */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-obsidian z-10"
            style={{ left: `${quorumPercent}%` }}
          />
        </div>

        {/* Threshold marker label */}
        <div className="relative mt-1 flex justify-between text-[10px] text-neutral-400">
          <span>0 Shares</span>
          <span
            className="font-bold text-obsidian absolute -translate-x-1/2"
            style={{ left: `${quorumPercent}%` }}
          >
            ▲ 51% Quorum (510k)
          </span>
          <span>1,000,000 Shares</span>
        </div>
      </div>

      {/* Voting & Execution Controls */}
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-black/[0.05]">
        <div className="text-xs text-neutral-500">
          Proposer: <span className="font-mono text-obsidian">{proposal.proposer}</span>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {!proposal.executed && (
            <>
              <motion.button
                whileTap={{ scale: 0.96 }}
                disabled={hasVoted}
                onClick={() => handleVote(true)}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  hasVoted
                    ? "bg-black/5 text-neutral-400 cursor-not-allowed"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Vote FOR (+{userShares.toLocaleString()})</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.96 }}
                disabled={hasVoted}
                onClick={() => handleVote(false)}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  hasVoted
                    ? "bg-black/5 text-neutral-400 cursor-not-allowed"
                    : "bg-red-50 text-red-800 border border-red-200 hover:bg-red-100"
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                <span>Vote AGAINST</span>
              </motion.button>
            </>
          )}

          {!proposal.executed && isQuorumReached && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => onExecute(proposal.id)}
              className="px-5 py-2 rounded-full bg-obsidian text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-black/90"
            >
              <span>Execute On-Chain</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
