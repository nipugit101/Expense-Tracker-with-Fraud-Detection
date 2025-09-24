import {
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Plus,
  Send,
  Users,
  Wallet as WalletIcon
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AddFundsModal from '../components/wallet/AddFundsModal';
import TransferModal from '../components/wallet/TransferModal';
import apiService from '../services/api';
import { Transaction, WalletContact } from '../types';

const Wallet: React.FC = () => {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [contacts, setContacts] = useState<WalletContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<WalletContact | null>(null);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching wallet data...');
      
      const [balanceResponse, transactionsResponse, contactsResponse] = await Promise.all([
        apiService.getWalletBalance(),
        apiService.getWalletTransactions({ limit: 10 }),
        apiService.getWalletContacts()
      ]);

      console.log('Balance response:', balanceResponse);
      console.log('Transactions response:', transactionsResponse);
      console.log('Contacts response:', contactsResponse);

      setBalance(balanceResponse?.balance || 0);
      setTransactions(transactionsResponse?.transactions || []);
      setContacts(contactsResponse?.contacts || []);
    } catch (error: any) {
      toast.error('Failed to load wallet data');
      console.error('Wallet error:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferSuccess = () => {
    setIsTransferModalOpen(false);
    setSelectedContact(null);
    fetchWalletData();
  };

  const handleAddFundsSuccess = () => {
    setIsAddFundsModalOpen(false);
    fetchWalletData();
  };

  const handleQuickTransfer = (contact: WalletContact) => {
    setSelectedContact(contact);
    setIsTransferModalOpen(true);
  };

  const handleTestAPI = async () => {
    try {
      console.log('Testing API calls...');
      const balance = await apiService.getWalletBalance();
      console.log('Direct balance call result:', balance);
      toast.success(`Balance fetched: $${balance.balance}`);
    } catch (error: any) {
      console.error('Direct API test failed:', error);
      toast.error(`API test failed: ${error.message || 'Unknown error'}`);
    }
  };

  const handleTestAddFunds = async () => {
    try {
      console.log('Testing add funds...');
      const response = await apiService.addFunds(10, 'Test funds');
      console.log('Add funds response:', response);
      toast.success('Test funds added successfully!');
      fetchWalletData(); // Refresh data
    } catch (error: any) {
      console.error('Add funds test failed:', error);
      toast.error(`Add funds test failed: ${error.response?.data?.message || error.message}`);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (isLoading) {
    return <LoadingSpinner size="large" className="min-h-96" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Digital Wallet</h1>
        <div className="flex space-x-3">
         
          <button
            onClick={() => setIsAddFundsModalOpen(true)}
            className="btn btn-secondary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Funds
          </button>
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="btn btn-primary flex items-center"
          >
            <Send className="h-4 w-4 mr-2" />
            Send Money
          </button>
        </div>
      </div>

      {/* Wallet Balance Card */}
      <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="card-content">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Available Balance</p>
              <p className="text-4xl font-bold mt-2">
                {formatCurrency(balance)}
              </p>
              <p className="text-primary-200 text-sm mt-2">
                Ready for instant transfers
              </p>
              {/* Debug info */}
              <p className="text-primary-300 text-xs mt-1">
                Balance value: {balance} | Type: {typeof balance}
              </p>
            </div>
            <div className="p-4 bg-white bg-opacity-20 rounded-full">
              <WalletIcon className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Quick Transfer
              </h3>
            </div>
            <div className="card-content">
              {contacts.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">No recent contacts</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Send your first transfer to see contacts here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contacts.slice(0, 5).map((contact) => (
                    <div
                      key={contact.email}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                      onClick={() => handleQuickTransfer(contact)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-semibold text-sm">
                            {contact.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{contact.name}</p>
                          <p className="text-gray-500 text-xs">{contact.email}</p>
                        </div>
                      </div>
                      <Send className="h-4 w-4 text-gray-400" />
                    </div>
                  ))}
                  
                  {contacts.length > 5 && (
                    <button
                      onClick={() => setIsTransferModalOpen(true)}
                      className="w-full text-center py-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      View all contacts
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Recent Transactions
                </h3>
                <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  View all
                </button>
              </div>
            </div>
            <div className="card-content">
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <WalletIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No wallet transactions yet</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Your transfers will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction._id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-full ${
                          transaction.type === 'transfer_out' ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                          {transaction.type === 'transfer_out' ? (
                            <ArrowUpRight className="h-5 w-5 text-red-600" />
                          ) : (
                            <ArrowDownRight className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {transaction.description}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.date).toLocaleDateString()} • 
                            {new Date(transaction.date).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'transfer_out' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {transaction.type === 'transfer_out' ? '-' : '+'}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {transaction.type === 'transfer_out' ? 'Sent' : 'Received'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="card-content">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <WalletIcon className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Secure & Protected</h4>
              <p className="text-sm text-blue-700 mt-1">
                Your wallet is protected by advanced fraud detection. All transfers are monitored 
                for suspicious activity and you'll be notified of any unusual transactions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isTransferModalOpen && (
        <TransferModal
          selectedContact={selectedContact}
          onClose={() => {
            setIsTransferModalOpen(false);
            setSelectedContact(null);
          }}
          onSuccess={handleTransferSuccess}
        />
      )}

      {isAddFundsModalOpen && (
        <AddFundsModal
          onClose={() => setIsAddFundsModalOpen(false)}
          onSuccess={handleAddFundsSuccess}
        />
      )}
    </div>
  );
};

export default Wallet;
