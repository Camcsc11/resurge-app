'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function CreatorLoginPage() {
  const [username, setUsername] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/creator-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, access_code: accessCode }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Login failed');
        toast({
          title: 'Login Failed',
          description: data.error || 'Invalid credentials',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Logged in successfully',
      });

      router.push('/creator-portal');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-[#1a2332] rounded-lg border border-[#2a3a4a] p-8">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">
          Creator Portal
        </h1>
        <p className="text-gray-400 text-center mb-6 text-sm">
          Sign in to manage your assigned reels
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <Input
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              className="w-full bg-[#0f1729] border-[#2a3a4a] text-white placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Access Code
            </label>
            <Input
              type="password"
              placeholder="Enter your access code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              disabled={isLoading}
              className="w-full bg-[#0f1729] border-[#2a3a4a] text-white placeholder-gray-500"
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded p-3">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || !username || !accessCode}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          Contact your admin if you don't have credentials
        </p>
      </div>
    </div>
  );
}
