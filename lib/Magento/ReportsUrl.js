export async function magentoReportRestFetch({
    path,
    method = "GET",
    headers = {},
    cache = "no-store",
    revalidate,
    tags,
    fetchOptions = {},
  }) {
    try {
      const endpoint = process.env.NEXT_PUBLIC_API_URL;
      const fetchConfig = {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        cache,
        ...fetchOptions,
      };
      if (tags || revalidate !== undefined) {
        fetchConfig.next = {};
        if (tags) fetchConfig.next.tags = tags;
        if (revalidate !== undefined) fetchConfig.next.revalidate = revalidate;
      }
  
      const result = await fetch(`${endpoint}/rest/${path}`, fetchConfig);
      const body = await result.json();
  
      if (!result.ok) {
        throw new Error(body?.message || "REST API error");
      }
  
      return {
        status: result.status,
        body,
      };
    } catch (err) {
      throw {
        error: err,
        message: err.message,
        path,
      };
    }
  }