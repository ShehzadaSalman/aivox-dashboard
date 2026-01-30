import { Link } from "react-router-dom";

function NotFound({ ctaHref = "/", ctaLabel = "Go to home", embedded = false }) {
  const wrapperClass = embedded
    ? "flex items-center justify-center py-16"
    : "min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100";

  return (
    <div className={wrapperClass}>
      <div className="max-w-xl rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-400">
          404
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-gray-900">
          Page not found
        </h1>
        <p className="mt-3 text-gray-600">
          The page you are looking for doesn't exist or has moved.
        </p>
        <Link
          to={ctaHref}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
