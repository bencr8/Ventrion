import { Connection, PublicKey } from "@solana/web3.js";

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const programId = new PublicKey("37WQY8a7fzyVTTov8U5zZQywWSD5h2gSV5XFo7CL67f8");
  const deployerPk = new PublicKey("2K9r52f1ZxuB1BQ1hhZWFgk1cGPcf7ucdvDHkGgf82TV");
  const round0Pda = new PublicKey("ofPFE4gdAg7wkS3NLLPh4vZBMfh7SY5qtuuXq8kJ6ZZ");
  
  const [recordPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("round_record"), round0Pda.toBuffer(), deployerPk.toBuffer()],
    programId
  );
  console.log("Record PDA:", recordPda.toBase58());
  const fs = await import("fs");
  const path = await import("path");
  const anchor = await import("@coral-xyz/anchor");
  const idl = JSON.parse(fs.readFileSync(path.resolve("target", "idl", "ventrion_protocol.json"), "utf-8"));
  const provider = new anchor.AnchorProvider(connection, { publicKey: deployerPk }, { commitment: "confirmed" });
  const program = new anchor.Program(idl, provider);
  const [milestoneEscrow0Pda] = PublicKey.findProgramAddressSync([Buffer.from("milestone_escrow"), round0Pda.toBuffer()], programId);
  console.log("Milestone Escrow PDA:", milestoneEscrow0Pda.toBase58());
  const escrow = await program.account.milestoneEscrow.fetch(milestoneEscrow0Pda);
  console.log("Milestone Escrow State:", JSON.stringify(escrow, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));
}

main().catch(console.error);
