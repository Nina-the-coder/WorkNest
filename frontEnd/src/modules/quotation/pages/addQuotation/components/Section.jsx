
/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

const Section = ({ icon: Icon, title, description, children }) => {
  return (
    <section className="overflow-visible rounded-2xl border border-border-color bg-card-bg">
      <div className="border-b border-border-color px-4 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cta/10 text-cta">
            <Icon size={18} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-text sm:text-base">
              {title}
            </h2>

            {description && (
              <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
};

export default Section;