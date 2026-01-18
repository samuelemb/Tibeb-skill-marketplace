"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { paymentsApi } from '@/lib/api';

const ChapaReturn: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'error'>('loading');
  const [jobId, setJobId] = useState<string | null>(null);
  const txRef =
    searchParams.get('tx_ref') ||
    searchParams.get('trx_ref') ||
    searchParams.get('reference');
  const returnJobId = searchParams.get('jobId');

  const verifyPayment = React.useCallback(
    (attempt = 0) => {
      const runVerify = (ref: string) => {
        paymentsApi
          .verifyEscrow(ref)
          .then((escrow) => {
            setJobId(escrow.jobId);
            if (escrow.status === 'PENDING') {
              setStatus('pending');
            } else {
              setStatus('success');
            }
          })
          .catch(() => {
            if (attempt < 2) {
              setTimeout(() => verifyPayment(attempt + 1), 1500);
              return;
            }
            setStatus('error');
          });
      };

      if (txRef) {
        runVerify(txRef);
        return;
      }

      if (returnJobId) {
        paymentsApi
          .getEscrowStatus(returnJobId)
          .then((escrow) => {
            if (escrow?.txRef) {
              runVerify(escrow.txRef);
              return;
            }
            setJobId(returnJobId);
            setStatus('pending');
          })
          .catch(() => {
            setStatus('error');
          });
        return;
      }

      setStatus('error');
    },
    [txRef, returnJobId]
  );

  useEffect(() => {
    verifyPayment();
  }, [verifyPayment]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-xl">
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              {status === 'loading' && <p className="text-gray-600">Verifying payment...</p>}
              {status === 'success' && (
                <>
                  <p className="text-gray-900 font-medium">Escrow funded successfully.</p>
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => router.push(jobId ? `/jobs/${jobId}` : '/jobs/my-jobs')}
                  >
                    Back to Job
                  </Button>
                </>
              )}
              {status === 'pending' && (
                <>
                  <p className="text-gray-600">Payment is still processing. Please retry verification.</p>
                  <div className="flex justify-center gap-3">
                    <Button variant="outline" onClick={() => verifyPayment()}>
                      Retry Verification
                    </Button>
                    <Button onClick={() => router.push('/jobs/my-jobs')}>
                      Back to My Jobs
                    </Button>
                  </div>
                </>
              )}
              {status === 'error' && (
                <>
                  <p className="text-gray-600">We could not verify this payment.</p>
                  <Button variant="outline" onClick={() => router.push('/jobs/my-jobs')}>
                    Back to My Jobs
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const ChapaReturnPage: React.FC = () => (
  <Suspense
    fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Loading payment status...</div>}
  >
    <ChapaReturn />
  </Suspense>
);

export default ChapaReturnPage;
