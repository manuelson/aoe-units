"use client";

import { useSearchHistory } from "@/context/search-history";
import { useTranslations } from "next-intl";
import { AvatarUi } from "./avatar-ui";
import Link from "next/link";

export function SearchHistory() {
  const { history } = useSearchHistory();
  const t = useTranslations();

  if (history.length === 0) return null;

  return (
    <div className="w-full max-w-2xl space-y-8 mt-4 grid grid-cols-2 gap-2 text-left pb-5">
      <div className="w-full max-w-md p-4 bg-white border border-gray-200 rounded-lg shadow-sm sm:p-8 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h5 className="text-xl font-bold leading-none text-gray-900 dark:text-white">
            Latest Search
          </h5>
        </div>
        <div>
          <ul
            role="list"
            className="divide-y divide-gray-200 dark:divide-gray-700"
          >
            {history.map(({ name, avatar, units }, index) => (
              <li className="py-3 sm:py-4" key={`${name}-${index}`}>
                <Link href={`/unit/${avatar}`}>
                  <div className="flex items-center">
                    <div className="shrink-0">
                      <AvatarUi name={name} avatar={avatar} />
                    </div>
                    <div className="flex-1 min-w-0 ms-4">
                      <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                        {name}
                      </p>
                      <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                        {units.join(", ")}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
