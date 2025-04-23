import { useTranslations } from "next-intl";

export const Footer = () => {
  const t = useTranslations();
  return (
    <footer className="w-full py-6 text-center text-sm text-muted-foreground border-t border-border/40">
      <div className="text-center">
        <p>{t("footer", { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
};
