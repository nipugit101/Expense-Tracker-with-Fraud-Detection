import { Mail, Search, Send, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import apiService from '../../services/api';
import { WalletContact } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';

interface TransferModalProps {
  selectedContact?: WalletContact | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface TransferFormData {
  recipientEmail: string;
  amount: number;
  description: string;
}

const TransferModal: React.FC<TransferModalProps> = ({
  selectedContact,
  onClose,
  onSuccess
}) => {
  const [contacts, setContacts] = useState<WalletContact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [showContactSearch, setShowContactSearch] = useState(!selectedContact);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<TransferFormData>({
    defaultValues: {
      recipientEmail: selectedContact?.email || '',
      amount: 0,
      description: ''
    }
  });

  const recipientEmail = watch('recipientEmail');

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (selectedContact) {
      setValue('recipientEmail', selectedContact.email);
      setShowContactSearch(false);
    }
  }, [selectedContact, setValue]);

  const fetchContacts = async () => {
    try {
      setIsLoadingContacts(true);
      const response = await apiService.getWalletContacts();
      setContacts(response.contacts);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectContact = (contact: WalletContact) => {
    setValue('recipientEmail', contact.email);
    setShowContactSearch(false);
    setSearchTerm('');
  };

  const onSubmit = async (data: TransferFormData) => {
    try {
      setIsLoading(true);
      await apiService.transferFunds({
        toEmail: data.recipientEmail,
        amount: data.amount,
        description: data.description || `Transfer to ${data.recipientEmail}`
      });
      
      toast.success('Transfer completed successfully!');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Transfer failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Send className="h-5 w-5 mr-2 text-primary-600" />
              Send Money
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isSubmitting}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Recipient Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Send to
              </label>
              
              {showContactSearch ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search contacts or enter email"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {searchTerm && (
                    <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                      {isLoadingContacts ? (
                        <div className="p-4 text-center">
                          <LoadingSpinner size="small" />
                        </div>
                      ) : filteredContacts.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          <div className="space-y-2">
                            <p className="text-sm">No contacts found</p>
                            <button
                              type="button"
                              onClick={() => {
                                setValue('recipientEmail', searchTerm);
                                setShowContactSearch(false);
                              }}
                              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                            >
                              Send to "{searchTerm}"
                            </button>
                          </div>
                        </div>
                      ) : (
                        filteredContacts.map((contact) => (
                          <div
                            key={contact.email}
                            onClick={() => selectContact(contact)}
                            className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-primary-600 font-semibold text-xs">
                                {contact.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {contact.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {contact.email}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <Mail className="h-4 w-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {recipientEmail}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowContactSearch(true)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Change
                  </button>
                </div>
              )}

              <input
                type="hidden"
                {...register('recipientEmail', {
                  required: 'Recipient email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />
              {errors.recipientEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.recipientEmail.message}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  {...register('amount', {
                    required: 'Amount is required',
                    min: { value: 0.01, message: 'Amount must be at least $0.01' },
                    max: { value: 10000, message: 'Amount cannot exceed $10,000' }
                  })}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg font-medium"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <input
                id="description"
                type="text"
                placeholder="What's this for?"
                {...register('description')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="flex-1 btn btn-primary py-3 font-medium"
              >
                {isSubmitting || isLoading ? (
                  <LoadingSpinner size="small" className="mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send Money
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransferModal;
