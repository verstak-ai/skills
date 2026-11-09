// The unsupported-cover warning (CONTRACT_WORDS; graph @nks/nks-dev, node #9786): said once at an
// explicit entry over a cover below CONTRACT_SUPPORT.minimum; the old hooks stay, the stamp is not
// bumped, and the rituals are taken again after a full align and its verification.
import type { Lang } from "../lang.ts";

export interface ContractWords {
  unsupported: (n: number, target: number) => string;
}

export const CONTRACT_WORDS: Readonly<Record<Lang, ContractWords>> = {
  en: {
    unsupported: (n: number, target: number): string =>
      `Contract ${n} is no longer supported; old hooks have not been removed. Run a full verstak align to contract ${target}; rituals will be accepted after verification`,
  },
};
