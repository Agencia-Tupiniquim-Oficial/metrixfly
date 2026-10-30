import { tupiniquimLogo } from "@/assets/brand";

type Props = {
  clientLogo?: string | null;
  className?: string;
};

/**
 * Agency logo and the analyzed site's logo as one centered group. The client logo is usually a small
 * square favicon, so it sits in a fixed frame instead of being stretched to the agency logo's height.
 */
export function ReportLogoLockup({ clientLogo, className = "" }: Props) {
  return (
    <div
      className={`flex items-center justify-center gap-4 sm:gap-6 ${className}`}
    >
      <img
        src={tupiniquimLogo}
        alt="Logo Tupiniquim"
        className="h-14 w-auto max-w-[180px] object-contain sm:h-20 sm:max-w-[220px]"
      />
      {clientLogo ? (
        <>
          <span aria-hidden="true" className="h-12 w-px bg-black/10 sm:h-16" />
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-white p-2.5 shadow-sm sm:h-20 sm:w-20 sm:p-3.5">
            <img
              src={clientLogo}
              alt="Logo do cliente"
              className="max-h-full max-w-full object-contain"
            />
          </span>
        </>
      ) : null}
    </div>
  );
}
