export type ParsedObjectiveQuestion = {
  number: string;
  questionText: string;
  options: { A?: string; B?: string; C?: string; D?: string };
};

export type ParsedAnswerTopic = {
  number: string;
  answer?: string;
  topic: string;
  passageLabel?: string;
};

export type MatchedObjectiveQuestion = {
  number: string;
  questionText: string;
  options: { A?: string; B?: string; C?: string; D?: string };
  answer: string;
  topic: string;
  issues: string[];
};

function parseOptionsFromText(text: string): { A?: string; B?: string; C?: string; D?: string } {
  const matches = text.split(/(?:^|\n|\s)([A-D])[\.\)]?\s*/).filter(Boolean);
  const result: Record<string, string> = {};
  for (let i = 0; i < matches.length; i += 2) {
    const letter = matches[i]?.trim().toUpperCase();
    const optText = matches[i + 1]?.trim();
    if (["A", "B", "C", "D"].includes(letter) && optText) {
      result[letter] = optText;
    }
  }
  return result;
}

export function parseObjectiveQuestions(text: string): ParsedObjectiveQuestion[] {
  const lines = text.split("\n");
  const blocks: { number: string; lines: string[] }[] = [];
  let current: { number: string; lines: string[] } | null = null;

  for (const line of lines) {
    const qMatch = line.match(/^\s*(\d+)[\.\)]\s*(.*)$/);
    if (qMatch) {
      if (current) blocks.push(current);
      current = { number: qMatch[1], lines: [qMatch[2]] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) blocks.push(current);

  return blocks.map(({ number, lines }) => {
    const block = lines.join("\n").trim();
    const optionMatch = block.match(/(?:^|\n|\s)A[\.\)]\s+/);
    let questionText = block;
    let optionsText = "";
    if (optionMatch && optionMatch.index !== undefined) {
      questionText = block.slice(0, optionMatch.index).trim();
      optionsText = block.slice(optionMatch.index).trim();
    }
    return {
      number,
      questionText,
      options: parseOptionsFromText(optionsText),
    };
  });
}

export function parseAnswerTopicLines(text: string): ParsedAnswerTopic[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const result: ParsedAnswerTopic[] = [];
  let lastMainNumber = "";

  for (const line of lines) {
    let number = "";
    let rest = "";

    const bracketed = line.match(/^(\d+)[\.\)]?\s*\(([a-zA-Z0-9ivxIVX]+)\)[\.\)]?\s*([\s\S]*)$/);
    const glued = line.match(/^(\d+)([a-zA-Z])[\.\)]\s*([\s\S]*)$/);
    const plain = line.match(/^(\d+)[\.\)]\s*([\s\S]*)$/);
    const bareContinuation = line.match(/^\(([a-zA-Z0-9ivxIVX]+)\)[\.\)]?\s*([\s\S]*)$/);

    if (bracketed) {
      lastMainNumber = bracketed[1];
      number = `${bracketed[1]}${bracketed[2]}`;
      rest = bracketed[3];
    } else if (glued) {
      lastMainNumber = glued[1];
      number = `${glued[1]}${glued[2]}`;
      rest = glued[3];
    } else if (plain) {
      lastMainNumber = plain[1];
      number = plain[1];
      rest = plain[2];
    } else if (bareContinuation && lastMainNumber) {
      number = `${lastMainNumber}${bareContinuation[1]}`;
      rest = bareContinuation[2];
    } else {
      continue;
    }

    rest = rest.trim();

    let passageLabel: string | undefined;
    const passageMatch = rest.match(/-\s*Passage\s*(\S+)\s*$/i);
    if (passageMatch && passageMatch.index !== undefined) {
      passageLabel = passageMatch[1];
      rest = rest.slice(0, passageMatch.index).trim();
    }

    const answerMatch = rest.match(/^([A-D])\s*-\s*(.*)$/);
    if (answerMatch) {
      result.push({ number, answer: answerMatch[1], topic: answerMatch[2].trim(), passageLabel });
    } else {
      result.push({ number, topic: rest, passageLabel });
    }
  }

  return result;
}

export type ParsedTheoryQuestion = {
  number: string;
  questionText: string;
};

export type MatchedTheoryQuestion = {
  number: string;
  mainNumber: number;
  subPart: string;
  questionText: string;
  topic: string;
  passageNumber?: number;
  issues: string[];
};

export function parseTheoryQuestions(text: string): ParsedTheoryQuestion[] {
  const lines = text.split("\n");
  const blocks: { number: string; lines: string[] }[] = [];
  let current: { number: string; lines: string[] } | null = null;
  let lastMainNumber = "";

  const finishCurrent = () => {
    if (current) blocks.push(current);
  };

  const matchLeadingNumber = (line: string) => {
    const digitMatch = line.match(/^\s*(\d+)([\s\S]*)$/);
    if (!digitMatch) return null;
    const mainNumber = digitMatch[1];
    const remainder = digitMatch[2];

    // Covers "3(a)", "3. (a)", "3 (a).", "3(a)." — a label in brackets, with
    // optional punctuation before AND after it.
    let m = remainder.match(/^[\.\)]?\s*\(([a-zA-Z0-9ivxIVX]+)\)[\.\)]?\s*([\s\S]*)$/);
    if (m) return { mainNumber, subPart: m[1], rest: m[2] };

    // Covers "3a." — the letter glued straight onto the number.
    m = remainder.match(/^([a-zA-Z])[\.\)]\s*([\s\S]*)$/);
    if (m) return { mainNumber, subPart: m[1], rest: m[2] };

    // Covers plain "3." with no sub-part at all.
    m = remainder.match(/^[\.\)]\s*([\s\S]*)$/);
    if (m) return { mainNumber, subPart: "", rest: m[1] };

    return null;
  };

  const matchBareSubPart = (line: string) => {
    const m = line.match(/^\s*\(([a-zA-Z0-9ivxIVX]+)\)[\.\)]?\s*([\s\S]*)$/);
    return m ? { subPart: m[1], rest: m[2] } : null;
  };

  for (const line of lines) {
    const leading = matchLeadingNumber(line);
    if (leading) {
      lastMainNumber = leading.mainNumber;
      finishCurrent();
      current = { number: `${leading.mainNumber}${leading.subPart}`, lines: [leading.rest] };
      continue;
    }

    const bare = lastMainNumber ? matchBareSubPart(line) : null;
    if (bare) {
      finishCurrent();
      current = { number: `${lastMainNumber}${bare.subPart}`, lines: [bare.rest] };
      continue;
    }

    if (current) current.lines.push(line);
  }
  finishCurrent();

  return blocks.map(({ number, lines }) => ({
    number,
    questionText: lines.join("\n").trim(),
  }));
}

function splitNumber(raw: string): { mainNumber: number; subPart: string } {
  const match = raw.match(/^(\d+)([a-zA-Z]?)$/);
  if (!match) return { mainNumber: NaN, subPart: "" };
  return { mainNumber: parseInt(match[1], 10), subPart: match[2] || "" };
}

export function matchTheory(
  questions: ParsedTheoryQuestion[],
  topics: ParsedAnswerTopic[]
): MatchedTheoryQuestion[] {
  const topicMap = new Map(topics.map((t) => [t.number, t]));
  const questionMap = new Map(questions.map((q) => [q.number, q]));
  const allNumbers = new Set([...questionMap.keys(), ...topicMap.keys()]);

  const results: MatchedTheoryQuestion[] = [];
  for (const number of allNumbers) {
    const q = questionMap.get(number);
    const t = topicMap.get(number);
    const issues: string[] = [];

    if (!q) issues.push("No matching question found in Box 1.");
    if (!t) issues.push("No matching topic found in Box 2.");
    if (t && !t.topic) issues.push("No topic text found.");

    const { mainNumber, subPart } = splitNumber(number);

    results.push({
      number,
      mainNumber,
      subPart,
      questionText: q?.questionText || "",
      topic: t?.topic || "",
      passageNumber: t?.passageLabel ? Number(t.passageLabel) : undefined,
      issues,
    });
  }

  return results.sort((x, y) => {
    if (x.mainNumber !== y.mainNumber) return x.mainNumber - y.mainNumber;
    return x.subPart.localeCompare(y.subPart);
  });
}
export function matchObjective(
  questions: ParsedObjectiveQuestion[],
  answers: ParsedAnswerTopic[]
): MatchedObjectiveQuestion[] {
  const answerMap = new Map(answers.map((a) => [a.number, a]));
  const questionMap = new Map(questions.map((q) => [q.number, q]));
  const allNumbers = new Set([...questionMap.keys(), ...answerMap.keys()]);

  const results: MatchedObjectiveQuestion[] = [];
  for (const number of allNumbers) {
    const q = questionMap.get(number);
    const a = answerMap.get(number);
    const issues: string[] = [];

    if (!q) issues.push("No matching question found in Box 1.");
    if (!a) issues.push("No matching answer/topic found in Box 2.");
    if (a && !a.answer) issues.push("No answer letter found (expected e.g. 'C - Synonyms').");
    if (q && Object.keys(q.options).length === 0 && q.questionText) {
      issues.push("No A-D options found for this question.");
    }

    results.push({
      number,
      questionText: q?.questionText || "",
      options: q?.options || {},
      answer: a?.answer || "",
      topic: a?.topic || "",
      issues,
    });
  }

  return results.sort((x, y) => parseInt(x.number, 10) - parseInt(y.number, 10));
}