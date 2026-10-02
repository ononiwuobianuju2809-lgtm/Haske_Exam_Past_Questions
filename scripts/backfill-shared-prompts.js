const mongoose = require("mongoose");

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const Paper = mongoose.model(
    "Paper",
    new mongoose.Schema({ examType: String, subject: String })
  );
  const SharedPrompt = mongoose.model(
    "SharedPrompt",
    new mongoose.Schema({ paper: mongoose.Schema.Types.ObjectId, component: String })
  );

  const prompts = await SharedPrompt.find({
    $or: [{ component: { $exists: false } }, { component: "" }],
  });

  let updated = 0;
  for (const prompt of prompts) {
    const paper = await Paper.findById(prompt.paper);
    if (!paper) continue;

    const isEnglish = (paper.subject || "").toLowerCase().includes("english");
    if (!isEnglish) continue; // non-English never needed a tag; leave untouched

    const newComponent = paper.examType === "JAMB" ? "Lexis and Structure" : "Grammar";
    prompt.component = newComponent;
    await prompt.save();
    updated += 1;
    console.log(`Updated prompt ${prompt._id} -> ${newComponent}`);
  }

  console.log(`Done. Updated ${updated} shared prompt(s).`);
  await mongoose.disconnect();
}

main();