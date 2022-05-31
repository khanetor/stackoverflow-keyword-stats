import ky from "https://cdn.skypack.dev/ky?dts";

type SOQuestion = {
  question_id: number;
  title: string;
  is_answered: boolean;
};

export type Question = {
  id: number;
  keywords: string[];
  answered: boolean;
};

type ApiResult = {
  questions: Question[];
  hasMore: boolean;
};

const punctuationsWith = /[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g;

function delay(time: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export async function* fetchAll(
  fromDate: Date,
  toDate: Date,
  tags: string[],
  pageSize = 100,
): AsyncGenerator<Question[]> {
  let page = 1;
  let hasMore = true;
  while (hasMore && page <= 25) {
    const result = await fetchOneBatch(fromDate, toDate, tags, pageSize, page);
    await delay(1000);
    page += 1;
    hasMore = result.hasMore;
    yield result.questions;
  }
}

async function fetchOneBatch(
  fromDate: Date,
  toDate: Date,
  tags: string[],
  pageSize: number,
  page: number,
): Promise<ApiResult> {
  const fromDateString = fromDate.getTime() / 1000;
  const toDateString = toDate.getTime() / 1000;
  const tagged = tags.join(";");
  const uri =
    `https://api.stackexchange.com/2.3/questions?page=${page}&pagesize=${pageSize}&fromdate=${fromDateString}&todate=${toDateString}&order=desc&sort=activity&tagged=${tagged}&site=stackoverflow`;

  console.log(uri);
  const response = await ky.get(uri);
  if (response.ok) {
    const data = await response.json();
    const extractedData = (data.items as SOQuestion[]).map((q) => ({
      "id": q.question_id,
      "keywords": q.title
        .replace(punctuationsWith, "")
        .split(/\s+/)
        .filter((w) => w.length > 0)
        .filter((w) => w.length <= 4),
      "answered": q.is_answered,
    }));
    return {
      questions: extractedData,
      hasMore: data.has_more as boolean,
    };
  } else {
    throw new Error(`Failed to fetch data: ${await response.text()}`);
  }
}
