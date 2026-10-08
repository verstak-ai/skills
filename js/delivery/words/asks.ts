// A question in a case (ASK): ask, answer, ack, withdrawal, the platform calling a role.
import type { Lang } from "../lang.ts";

export interface AskWords {
  ask: (
    author: string,
    to: string,
    toPlace: string,
    key: string,
    done: string,
    form: string,
    advice: string,
  ) => string;
  place: (place: string) => string;
  yesNo: () => string;
  free: () => string;
  choice: (options: string) => string;
  advice: (option: string, why: string) => string;
  answer: (author: string, refersTo: string, reply: string) => string;
  ack: (refersTo: string, reply: string, author: string) => string;
  withdrawn: (
    withdraws: string,
    key: string,
    done: string,
    verdict: string,
    author: string,
  ) => string;
  inviteOwnerless: (who: string, standing: string) => string;
  inviteAnswerWaiting: (who: string, standing: string) => string;
}

export const ASK: Readonly<Record<Lang, AskWords>> = {
  en: {
    ask: (author, to, toPlace, key, done, form, advice) =>
      `${author} asks the role ${to}${toPlace} [${key}]: “${done}”${form}${advice}`,
    place: (place) => `(seat ${place})`,
    yesNo: () => "answer: yes or no (yes | no)",
    free: () => "answer in your own words",
    choice: (options) => `options: ${options}`,
    advice: (option, why) => `recommended: ${option}${why}`,
    answer: (author, refersTo, reply) => `${author} answers [${refersTo}]: ${reply}`,
    ack: (refersTo, reply, author) => `answer [${refersTo}] accepted${reply} · ${author}`,
    withdrawn: (withdraws, key, done, verdict, author) =>
      `question [${withdraws}] withdrawn: [${key}] [${done}] = ${verdict} · ${author}`,
    inviteOwnerless: (who, standing) =>
      `the platform calls the role ${who} to the case: the seat ${standing} is gone, its lines are nobody's`,
    inviteAnswerWaiting: (who, standing) =>
      `the platform calls the role ${who} to the case: an answer awaits acceptance, the asking seat ${standing} has left`,
  },
};
