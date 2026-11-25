import { redirect } from 'next/navigation';

export default async function DashboardTrackRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;
  const queryString = new URLSearchParams();
  for (const [key, val] of Object.entries(resolvedParams)) {
    if (typeof val === 'string') {
      queryString.set(key, val);
    } else if (Array.isArray(val)) {
      val.forEach((v) => queryString.append(key, v));
    }
  }
  const query = queryString.toString();
  redirect(query ? `/track?${query}` : '/track');
}
