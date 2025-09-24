import { CheckCircle, Mail, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiService from '../../services/api';

const VerifyEmail: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const { token } = useParams<{ token: string }>();

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification token');
        return;
      }

      try {
        await apiService.verifyEmail(token);
        setStatus('success');
        setMessage('Your email has been successfully verified!');
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Email verification failed');
      }
    };

    verifyEmail();
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Verifying your email...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="flex justify-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              status === 'success' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {status === 'success' ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600" />
              )}
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {status === 'success' ? 'Email Verified!' : 'Verification Failed'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {message}
          </p>
        </div>

        <div className="space-y-4">
          {status === 'success' ? (
            <Link
              to="/login"
              className="btn btn-primary w-full"
            >
              Continue to login
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="btn btn-primary w-full"
              >
                Try again
              </Link>
              <Link
                to="/login"
                className="btn btn-secondary w-full"
              >
                Back to login
              </Link>
            </>
          )}
        </div>

        {status === 'error' && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <Mail className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Need help?
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    If you're having trouble verifying your email, please contact our support team.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
