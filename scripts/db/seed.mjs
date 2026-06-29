import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import mysql from "mysql2/promise";

function loadLocalEnvFile(path) {
  if (!existsSync(path)) {
    return;
  }

  const lines = readFileSync(path, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

loadLocalEnvFile(".env.local");

const databaseUrl =
  process.env.DATABASE_URL ??
  "mysql://diagnosi_user:diagnosi_password@127.0.0.1:3306/diagnosi_ia";

const connection = await mysql.createConnection({
  uri: databaseUrl,
  timezone: "Z",
});

const questionnaire = {
  id: "002",
  version: "2026.2",
  title: "Diagnosi IA - Qüestionari 2026.2",
};

const blockSeed = [
  { id: "01", position: 1, title: "Alfabetització i ús crític de la IA" },
  { id: "02", position: 2, title: "Ús de la IA en la pràctica docent" },
  { id: "03", position: 3, title: "Ús de la IA amb l'alumnat" },
  { id: "04", position: 4, title: "Avaluació i retroacció" },
  { id: "05", position: 5, title: "Dades, seguretat i criteris compartits" },
];

const questionSeed = [
  [1, 1, 1, "Identifico oportunitats i limitacions de la IA en contextos educatius."],
  [2, 2, 1, "Contrasto les respostes generades per IA abans d'utilitzar-les."],
  [3, 3, 1, "Explico que la IA pot contenir errors, biaixos o informació inventada."],
  [4, 4, 1, "Conec criteris bàsics d'ús ètic i responsable de la IA."],
  [5, 1, 2, "Utilitzo IA per preparar materials didàctics."],
  [6, 2, 2, "Utilitzo IA per adaptar activitats a necessitats diverses de l'alumnat."],
  [7, 3, 2, "Utilitzo IA per generar idees, exemples o seqüències d'aprenentatge."],
  [8, 4, 2, "Reviso i ajusto les propostes generades per IA abans de portar-les a l'aula."],
  [9, 1, 3, "Proposo activitats on l'alumnat utilitza IA amb un objectiu d'aprenentatge clar."],
  [10, 2, 3, "Ajudo l'alumnat a formular bones instruccions i revisar resultats de la IA."],
  [11, 3, 3, "Promoc que l'alumnat declari quan ha utilitzat IA en una tasca."],
  [12, 4, 3, "Treballo amb l'alumnat els límits de la IA i la importància del criteri propi."],
  [13, 1, 4, "Utilitzo IA per preparar rúbriques o criteris d'avaluació."],
  [14, 2, 4, "Utilitzo IA per generar exemples de retroacció que després reviso."],
  [15, 3, 4, "Integro la IA per detectar patrons generals de dificultats d'aprenentatge."],
  [16, 4, 4, "Mantinc la decisió docent final en qualsevol procés d'avaluació assistit per IA."],
  [17, 1, 5, "Evito introduir dades personals o sensibles en eines d'IA."],
  [18, 2, 5, "Conec criteris bàsics de protecció de dades aplicats a la IA."],
  [19, 3, 5, "L'equip educatiu disposa de criteris compartits sobre quan i com utilitzar IA."],
  [20, 4, 5, "Conversem com a equip docent sobre riscos, oportunitats i bones pràctiques d'IA."],
].map(([position, blockPosition, blockNumber, text]) => ({
  position,
  blockPosition,
  blockNumber,
  text,
}));

try {
  await connection.beginTransaction();

  await connection.execute(
    `
      insert into questionnaires (id, version, title, is_active)
      values (?, ?, ?, true)
      on duplicate key update
        title = values(title),
        is_active = values(is_active)
    `,
    [questionnaire.id, questionnaire.version, questionnaire.title],
  );

  for (const block of blockSeed) {
    await connection.execute(
      `
        insert into question_blocks (id, questionnaire_id, position, title)
        values (?, ?, ?, ?)
        on duplicate key update
          title = values(title)
      `,
      [block.id, questionnaire.id, block.position, block.title],
    );
  }

  for (const question of questionSeed) {
    const block = blockSeed.find((item) => item.position === question.blockNumber);

    if (!block) {
      throw new Error(`Missing block for question position ${question.position}`);
    }

    await connection.execute(
      `
        insert into questions (
          id,
          questionnaire_id,
          block_id,
          position,
          block_position,
          text,
          scale_min,
          scale_max
        )
        values (?, ?, ?, ?, ?, ?, 0, 3)
        on duplicate key update
          block_id = values(block_id),
          block_position = values(block_position),
          text = values(text),
          scale_min = values(scale_min),
          scale_max = values(scale_max)
      `,
      [
        randomUUID(),
        questionnaire.id,
        block.id,
        question.position,
        question.blockPosition,
        question.text,
      ],
    );
  }

  const [shapeRows] = await connection.execute(
    `
      select
        (select count(*) from question_blocks where questionnaire_id = ?) as block_count,
        (select count(*) from questions where questionnaire_id = ?) as question_count,
        (
          select count(*)
          from (
            select block_id
            from questions
            where questionnaire_id = ?
            group by block_id
            having count(*) <> 4
          ) invalid_blocks
        ) as invalid_block_count
    `,
    [questionnaire.id, questionnaire.id, questionnaire.id],
  );

  const shape = shapeRows[0];

  if (
    Number(shape.block_count) !== 5 ||
    Number(shape.question_count) !== 20 ||
    Number(shape.invalid_block_count) !== 0
  ) {
    throw new Error(
      `Invalid questionnaire seed shape: blocks ${shape.block_count}, questions ${shape.question_count}, invalid blocks ${shape.invalid_block_count}`,
    );
  }

  await connection.commit();
  console.log("Seeded questionnaire 2026.2 with 5 blocks and 20 questions.");
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
