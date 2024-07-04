import { Link } from "react-router-dom";

export function Logo() {
  return (
    <Link
      to="/"
      className="group shrink-0 items-center text-center justify-center text-lg font-semibold px-2 sm:py-4"
    >
      <p className="text-2xl">WACQT</p>
      <p className="font-thin text-base">
        Wallenberg Centre for Quantum Technology
      </p>
      <span className="sr-only">
        WACQT: Wallenberg Centre for Quantum Technology
      </span>
    </Link>
  );
}
