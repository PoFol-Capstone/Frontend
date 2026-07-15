import { getTranslations } from "next-intl/server";

export default async function Page() {
  const t = await getTranslations("profile");
  return <div>{t("editPageStub")}</div>;
}
