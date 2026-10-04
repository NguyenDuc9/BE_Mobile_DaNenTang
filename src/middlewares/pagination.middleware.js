const PAGE_SIZE = 15;

function paginateResponse(req, res, next) {
  if (req.method !== 'GET') return next();

  const sendJson = res.json.bind(res);
  res.json = (body) => {
    const rows = Array.isArray(body)
      ? body
      : Array.isArray(body?.data)
        ? body.data
        : null;
    if (!rows) return sendJson(body);

    const requestedPage = Number.parseInt(req.query.page, 10);
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const page =
      Number.isSafeInteger(requestedPage) && requestedPage > 0
        ? requestedPage
        : 1;
    const limit =
      Number.isSafeInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, PAGE_SIZE)
        : PAGE_SIZE;
    const total = rows.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const data = rows.slice(start, start + limit);
    const pagination = { page, limit, total, totalPages };

    return sendJson(
      Array.isArray(body)
        ? { data, pagination }
        : { ...body, data, pagination },
    );
  };

  next();
}

module.exports = paginateResponse;
