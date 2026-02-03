import React from 'react';
import { Search } from 'lucide-react';

const SearchForm = ({
  query,
  suggestions,
  suggesting,
  onQueryChange,
  onSearch,
  onSelectSuggestion,
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef(null);
  const handleSubmit = (e) => {
    e.preventDefault();
    const input = e.target.searchInput.value.trim();
    if (input) {
      onSearch(input);
      onQueryChange('');
      inputRef.current?.blur();
      setIsFocused(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <input
          type="text"
          name="searchInput"
          value={query}
          ref={inputRef}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 50)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              onQueryChange('');
              inputRef.current?.blur();
              setIsFocused(false);
            }
          }}
          placeholder=""
          className={`${
            isFocused || query
              ? 'w-56 sm:w-64 md:w-72 lg:w-80 pl-11 pr-12 py-3 text-base'
              : 'w-10 h-10 px-0 py-0 text-sm border-white/40'
          } rounded-full bg-white/10 backdrop-blur-md text-white placeholder-blue-200 border border-white/20 focus:outline-none focus:border-blue-400 transition-all duration-200`}
        />
        <Search
          className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-blue-200 transition-all ${
            isFocused || query ? 'left-4' : 'left-1/2 -translate-x-1/2'
          }`}
        />
        {!isFocused && !query && (
          <button
            type="button"
            onClick={() => inputRef.current?.focus()}
            className="absolute inset-0 rounded-full"
            aria-label="Öppna sök"
          />
        )}
        <button
          type="submit"
          className={`absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-blue-500/50 cursor-pointer flex items-center justify-center ${
            isFocused ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <Search className="w-4 h-4" />
        </button>

        {isFocused && suggesting && (
          <div className="absolute left-0 right-0 mt-2 z-20 rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl px-4 py-3 text-blue-200 text-sm">
            Söker...
          </div>
        )}

        {isFocused && !suggesting && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 mt-2 z-20 rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl overflow-hidden">
            {suggestions.map((item) => (
              <button
                key={`${item.name}-${item.lat}-${item.lon}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelectSuggestion(item);
                  onQueryChange('');
                  inputRef.current?.blur();
                  setIsFocused(false);
                }}
                className="w-full text-left px-4 py-3 text-blue-100 hover:bg-white/10 transition-colors"
              >
                {[
                  item.name,
                  item.state,
                  item.country,
                ].filter(Boolean).join(', ')}
              </button>
            ))}
          </div>
        )}
      </div>

    </form>
  );
};

export default SearchForm;
