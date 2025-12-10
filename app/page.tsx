'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

type Talent = {
  id: number;
  user: {
    first_name: string;
    last_name: string;
    public_name: string;
    title: string;
    introduction_headline?: string;
    avatar?: string;
    avatar_thumbnail?: string;
  };
  role: {
    name: string;
    color: string;
  };
  location: string;
  country: string;
  total_jobs?: number;
  average_rating?: string;
  review_count: number;
  availability_for_work: boolean;
  superpowers?: Array<{ id: number; name: string }>;
  personal_rank?: number[];
};

type ViewMode = 'table' | 'list' | 'grid' | 'card';

export default function Home() {
  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [roles, setRoles] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch talents
  useEffect(() => {
    const fetchTalents = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '20',
        });
        if (debouncedSearch) params.append('search', debouncedSearch);
        if (roleFilter) params.append('role', roleFilter);

        const response = await fetch(`/api/talent?${params}`);
        const data = await response.json();
        
        setTalents(data.talents || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
        if (data.filters?.roles) {
          setRoles(data.filters.roles);
        }
      } catch (error) {
        console.error('Error fetching talents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTalents();
  }, [page, debouncedSearch, roleFilter]);

  const getRoleColor = (color: string) => {
    const colorMap: Record<string, string> = {
      'violet': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'green': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'blue': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'teal': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      'orange': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    };
    return colorMap[color] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  const ViewToggle = () => (
    <div className="flex gap-2 rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-white dark:bg-gray-800">
      {(['table', 'list', 'grid', 'card'] as ViewMode[]).map((mode) => (
        <button
          key={mode}
          onClick={() => setViewMode(mode)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
            viewMode === mode
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          {mode}
        </button>
      ))}
    </div>
  );

  const TableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Name</th>
            <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Title</th>
            <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Role</th>
            <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Location</th>
            <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Rating</th>
            <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Jobs</th>
          </tr>
        </thead>
        <tbody>
          {talents.map((talent) => (
            <tr key={talent.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="p-4">
                <div className="flex items-center gap-3">
                  {talent.user.avatar_thumbnail && (
                    <Image
                      src={talent.user.avatar_thumbnail}
                      alt={talent.user.public_name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  )}
                  <span className="font-medium">{talent.user.public_name}</span>
                </div>
              </td>
              <td className="p-4 text-gray-600 dark:text-gray-400">{talent.user.title}</td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(talent.role.color)}`}>
                  {talent.role.name}
                </span>
              </td>
              <td className="p-4 text-gray-600 dark:text-gray-400">{talent.location}</td>
              <td className="p-4">
                {talent.average_rating ? (
                  <span className="flex items-center gap-1">
                    ⭐ {talent.average_rating} ({talent.review_count})
                  </span>
                ) : (
                  <span className="text-gray-400">No ratings</span>
                )}
              </td>
              <td className="p-4 text-gray-600 dark:text-gray-400">{talent.total_jobs || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const ListView = () => (
    <div className="space-y-4">
      {talents.map((talent) => (
        <div
          key={talent.id}
          className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
        >
          {talent.user.avatar_thumbnail && (
            <Image
              src={talent.user.avatar_thumbnail}
              alt={talent.user.public_name}
              width={60}
              height={60}
              className="rounded-full"
            />
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{talent.user.public_name}</h3>
            <p className="text-gray-600 dark:text-gray-400">{talent.user.title}</p>
            {talent.user.introduction_headline && (
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{talent.user.introduction_headline}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(talent.role.color)}`}>
              {talent.role.name}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">{talent.location}</span>
          </div>
        </div>
      ))}
    </div>
  );

  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {talents.map((talent) => (
        <div
          key={talent.id}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex flex-col items-center text-center mb-4">
            {talent.user.avatar_thumbnail && (
              <Image
                src={talent.user.avatar_thumbnail}
                alt={talent.user.public_name}
                width={80}
                height={80}
                className="rounded-full mb-3"
              />
            )}
            <h3 className="font-semibold text-lg">{talent.user.public_name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{talent.user.title}</p>
          </div>
          <div className="space-y-2">
            <div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(talent.role.color)}`}>
                {talent.role.name}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">📍 {talent.location}</p>
            {talent.average_rating && (
              <p className="text-sm">⭐ {talent.average_rating} ({talent.review_count} reviews)</p>
            )}
            {talent.superpowers && talent.superpowers.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {talent.superpowers.slice(0, 3).map((skill) => (
                  <span key={skill.id} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {skill.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const CardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {talents.map((talent) => (
        <div
          key={talent.id}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-xl transition-shadow"
        >
          <div className="flex gap-4 mb-4">
            {talent.user.avatar_thumbnail && (
              <Image
                src={talent.user.avatar_thumbnail}
                alt={talent.user.public_name}
                width={100}
                height={100}
                className="rounded-lg"
              />
            )}
            <div className="flex-1">
              <h3 className="font-bold text-xl mb-1">{talent.user.public_name}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-2">{talent.user.title}</p>
              {talent.user.introduction_headline && (
                <p className="text-sm text-gray-500 dark:text-gray-500">{talent.user.introduction_headline}</p>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(talent.role.color)}`}>
                {talent.role.name}
              </span>
              {talent.availability_for_work && (
                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                  Available
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">📍 {talent.location}</p>
            {talent.average_rating && (
              <div className="flex items-center gap-2">
                <span className="text-lg">⭐</span>
                <span className="font-semibold">{talent.average_rating}</span>
                <span className="text-sm text-gray-500">({talent.review_count} reviews)</span>
              </div>
            )}
            {talent.total_jobs !== null && talent.total_jobs !== undefined && (
              <p className="text-sm text-gray-600 dark:text-gray-400">💼 {talent.total_jobs} jobs completed</p>
            )}
            {talent.superpowers && talent.superpowers.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Skills:</p>
                <div className="flex flex-wrap gap-2">
                  {talent.superpowers.map((skill) => (
                    <span key={skill.id} className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">Braintrust Talents</h1>
          <p className="text-gray-600 dark:text-gray-400">Browse and search through talented professionals</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, title, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Roles</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <ViewToggle />
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {talents.length} of {total} talents
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : talents.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No talents found</p>
          </div>
        ) : (
          <>
            {viewMode === 'table' && <TableView />}
            {viewMode === 'list' && <ListView />}
            {viewMode === 'grid' && <GridView />}
            {viewMode === 'card' && <CardView />}

            {/* Pagination */}
            <div className="mt-8 flex justify-center items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
