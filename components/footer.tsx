import { useTranslations } from "next-intl";

export const Footer = () => {
  const t = useTranslations();
  return (
    <footer className="w-full py-6 text-center text-sm text-muted-foreground border-t border-border/40 ">
      <div className="text-center">
        <div className="text-xs">
          <p>
            {t("footer", { year: new Date().getFullYear() })} - Age of empires
            II counter units.
          </p>
          <p className="text-gray-400">
            The website was created under Microsoft's{" "}
            <a
              className="underline"
              href="https://www.xbox.com/en-us/developers/rules"
            >
              Game Content Usage Rules
            </a>{" "}
            using assets from Age of Empires II.
          </p>
        </div>
      </div>
    </footer>
  );
};
