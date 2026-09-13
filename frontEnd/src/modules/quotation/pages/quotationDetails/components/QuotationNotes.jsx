const QuotationNotes = ({ notes }) => {
  if (!notes) {
    return null;
  }

  return (
    <div className="mt-10 border-t border-border-color pt-8">
      <h3 className="text-sm font-semibold text-text">Notes & Terms</h3>

      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-500">
        {notes}
      </p>
    </div>
  );
};

export default QuotationNotes;
