'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

type Talent = {
  id: number;
  user: {
    first_name: string;
    last_name: string;
    public_name: string;
    title: string;
    introduction_headline?: string;
    introduction?: string;
    avatar?: string;
    avatar_thumbnail?: string;
  };
  role: {
    name: string;
    color: string;
  };
  external_profiles: [
    {
      id: number;
      site: {
        id: number;
        name: string;
        logo: {
          id: number;
          thumbnail: string;
        };
        placeholder: string;
      };
      public_url: string;
    }
  ];
  location: string;
  country: string;
  total_jobs?: number;
  average_rating?: string;
  review_count: number;
  availability_for_work: boolean;
  superpowers?: Array<{ id: number; name: string }>;
  personal_rank?: number[];
};

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || '');
  const [nationalityFilter, setNationalityFilter] = useState(searchParams.get('nationality') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [roles, setRoles] = useState<string[]>([]);
  const [nationalities, setNationalities] = useState<string[]>([]);
  const [availableOnly, setAvailableOnly] = useState(searchParams.get('available') === 'true');
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') || '');

  // Helper function to get initials from name
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (roleFilter) params.set('role', roleFilter);
    if (nationalityFilter) params.set('nationality', nationalityFilter);
    if (availableOnly) params.set('available', 'true');
    if (page > 1) params.set('page', page.toString());
    
    const newUrl = params.toString() ? `/?${params.toString()}` : '/';
    router.replace(newUrl, { scroll: false });
  }, [debouncedSearch, roleFilter, nationalityFilter, availableOnly, page, router]);

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
        if (nationalityFilter) params.append('nationality', nationalityFilter);
        if (availableOnly) params.append('available', 'true');

        const response = await fetch(`/api/talent?${params}`);
        const data = await response.json();
        
        setTalents(data.talents || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
        if (data.filters?.roles) {
          setRoles(data.filters.roles);
        }
        if (data.filters?.nationalities) {
          setNationalities(data.filters.nationalities);
        }
      } catch (error) {
        console.error('Error fetching talents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTalents();
  }, [page, debouncedSearch, roleFilter, nationalityFilter, availableOnly]);

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

  const TableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Name</th>
            <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Socials</th>
            <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Title</th>
            <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Role</th>
            <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Location</th>
            <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Jobs</th>
          </tr>
        </thead>
        <tbody>
          {talents.map((talent) => (
            <tr key={talent.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {talent.user.avatar_thumbnail ? (
                      <Image
                        src={talent.user.avatar_thumbnail}
                        alt={talent.user.public_name}
                        width={40}
                        height={40}
                        className={`rounded-full ${talent.availability_for_work ? 'ring-2 ring-green-500' : ''}`}
                      />
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white bg-gradient-to-br from-blue-500 to-purple-600 ${talent.availability_for_work ? 'ring-2 ring-green-500' : ''}`}
                      >
                        {getInitials(talent.user.public_name)}
                      </div>
                    )}
                  </div>
                  <a
                    href={`https://app.usebraintrust.com/talent/${talent.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {talent.user.public_name}
                  </a>
                </div>
              </td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  {talent.external_profiles.map((profile) => (
                    <a href={profile.public_url} target="_blank" rel="noopener noreferrer" key={profile.id}>
                      <Image src={profile.site.logo.thumbnail} alt={profile.site.name} width={20} height={20} className="rounded-full" />
                    </a>
                  ))}
                </div>
              </td>
              <td className="p-4 text-gray-600 dark:text-gray-400">{talent.user.introduction_headline}</td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(talent.role.color)}`}>
                  {talent.role.name}
                </span>
              </td>
              <td className="p-4 text-gray-600 dark:text-gray-400">{talent.location}</td>
              <td className="p-4 text-gray-600 dark:text-gray-400">{talent.total_jobs || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
                placeholder="Search by name, introduction, or headline..."
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
            <select
              value={nationalityFilter}
              onChange={(e) => {
                setNationalityFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Nationalities</option>
              {nationalities.map((nationality) => (
                <option key={nationality} value={nationality}>
                  {nationality}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => {
                  setAvailableOnly(e.target.checked);
                  setPage(1);
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Available Only</span>
            </label>
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
            <TableView />

            {/* Pagination */}
            <div className="mt-8 flex justify-center items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Previous
              </button>
              <div className="flex items-center gap-2">
                <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                  Page
                </span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={page}
                  onChange={(e) => {
                    const newPage = parseInt(e.target.value);
                    if (newPage >= 1 && newPage <= totalPages) {
                      setPage(newPage);
                    }
                  }}
                  className="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                  of {totalPages}
                </span>
              </div>
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

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
