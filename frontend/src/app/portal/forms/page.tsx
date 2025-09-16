'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import { intakeForms, getIntakeForm, IntakeForm, IntakeQuestion, IntakeStep } from '@/lib/intake-forms';

export default function FormsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('library');
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [newCustomForm, setNewCustomForm] = useState<{
    name: string;
    category: string;
    status: 'active' | 'draft';
    description: string;
    estimatedTime: string;
    questions: Array<{
      question: string;
      type: IntakeQuestion['type'];
      required: boolean;
      options: string; // comma-separated for select/multiselect/scale
    }>;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewForm, setPreviewForm] = useState<any>(null);
  const [editingForm, setEditingForm] = useState<any>(null);
  const [selectedIntakeForm, setSelectedIntakeForm] = useState<IntakeForm | null>(null);
  const [currentPreviewStep, setCurrentPreviewStep] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const FORM_CATEGORIES = [
    { value: 'follow-up', label: 'Follow-up' },
    { value: 'monitoring', label: 'Monitoring' },
    { value: 'intake', label: 'Intake' },
    { value: 'consent', label: 'Consent' },
    { value: 'screening', label: 'Screening' },
  ];

  type CustomQuestion = {
    id: string;
    question: string;
    type: IntakeQuestion['type'];
    required: boolean;
    options?: string[];
  };

  type CustomForm = {
    id: string;
    name: string;
    type: 'custom';
    category: string;
    status: 'active' | 'draft';
    submissions: number;
    lastUpdated: string;
    description?: string;
    estimatedTime?: string;
    questions: CustomQuestion[];
  };

  const [customForms, setCustomForms] = useState<CustomForm[]>([
    {
      id: 'custom-1',
      name: 'Follow-up Questionnaire',
      type: 'custom',
      category: 'follow-up',
      status: 'active',
      submissions: 45,
      lastUpdated: '2024-12-08',
      description: 'Quick follow-up to assess progress and side effects.',
      estimatedTime: '3-5 min',
      questions: [
        { id: 'q-1', question: 'How are you feeling since your last visit?', type: 'textarea', required: false },
        { id: 'q-2', question: 'Have you noticed any side effects?', type: 'yesno', required: true },
      ],
    },
    {
      id: 'custom-2',
      name: 'Side Effects Report',
      type: 'custom',
      category: 'monitoring',
      status: 'active',
      submissions: 23,
      lastUpdated: '2024-12-07',
      description: 'Report any adverse effects you are experiencing.',
      estimatedTime: '2-4 min',
      questions: [
        { id: 'q-1', question: 'Select side effects you have experienced', type: 'multiselect', required: false, options: ['Nausea','Headache','Dizziness','Other'] },
        { id: 'q-2', question: 'When did symptoms start?', type: 'date', required: true },
      ],
    },
  ]);

  const [showCustomPreview, setShowCustomPreview] = useState(false);
  const [selectedCustomForm, setSelectedCustomForm] = useState<CustomForm | null>(null);
  const [editingCustomForm, setEditingCustomForm] = useState<{
    id: string;
    name: string;
    category: string;
    status: 'active' | 'draft';
    description: string;
    estimatedTime: string;
    questions: Array<{ question: string; type: IntakeQuestion['type']; required: boolean; options: string; }>
  } | null>(null);
  const [deleteTargetForm, setDeleteTargetForm] = useState<CustomForm | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    
    if (!token) {
      router.push('/portal/login');
      return;
    }
    
    // Check if user has admin access
    if (role === 'provider') {
      // Regular providers don't have access to forms management
      router.push('/portal/dashboard');
      return;
    }
    
    // Admin, provider-admin, and super-admin can access
    if (role === 'admin' || role === 'provider-admin' || role === 'super-admin') {
      // User has access, continue with page logic
    } else {
      // Default redirect if no valid role
      router.push('/portal/dashboard');
    }
  }, [router]);

  const handlePreviewIntakeForm = (formKey: string) => {
    const form = getIntakeForm(formKey);
    if (form) {
      setSelectedIntakeForm(form);
      setCurrentPreviewStep(0);
      setShowPreview(true);
    }
  };

  const renderQuestionInput = (question: IntakeQuestion) => {
    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
            placeholder={question.placeholder || 'Enter your answer...'}
            required={question.required}
          />
        );
      
      case 'textarea':
        return (
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
            rows={4}
            placeholder={question.placeholder || 'Enter your answer...'}
            required={question.required}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
            placeholder={question.placeholder}
            min={question.validation?.min}
            max={question.validation?.max}
            required={question.required}
          />
        );
      
      case 'select':
        return (
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
            required={question.required}
          >
            <option value="">Select an option...</option>
            {question.options?.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'multiselect':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="checkbox"
                  value={option}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'yesno':
        return (
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name={question.id}
                value="yes"
                required={question.required}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name={question.id}
                value="no"
                required={question.required}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">No</span>
            </label>
          </div>
        );
      
      case 'scale':
        return (
          <div className="flex justify-between">
            {question.options?.map((option) => (
              <label key={option} className="flex flex-col items-center">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  required={question.required}
                  className="mb-1"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'date':
        return (
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
            required={question.required}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
      />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medical Forms</h1>
          <p className="text-gray-600 mt-1">Comprehensive intake forms and questionnaires</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Import JSON
          </button>
          <button
            onClick={() => {
              setNewCustomForm({
                name: '',
                category: FORM_CATEGORIES[0].value,
                status: 'draft',
                description: '',
                estimatedTime: '',
                questions: [
                  { question: '', type: 'text', required: false, options: '' }
                ],
              });
              setShowFormBuilder(true);
            }}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
          >
            Create Custom Form
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('library')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'library'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Intake Form Library
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'custom'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Custom Forms
          </button>
        </nav>
      </div>

      {/* Intake Forms Library */}
      {activeTab === 'library' && (
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Medical Intake Forms</h2>
            <p className="text-sm text-gray-600">
              Comprehensive, clinically-designed forms for various conditions. These forms include advanced logic, 
              validations, and follow-up questions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(intakeForms).map(([key, form]) => (
              <Card key={key} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{form.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{form.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{form.estimatedTime}</p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">{form.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Steps:</span>
                    <span className="font-medium">{form.steps.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Questions:</span>
                    <span className="font-medium">
                      {form.steps.reduce((sum, step) => sum + step.questions.length, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Condition:</span>
                    <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-between">
                  <button
                    onClick={() => handlePreviewIntakeForm(key)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Preview
                  </button>
                  <button className="text-sm text-gray-600 hover:text-gray-900">
                    Copy
                  </button>
                  <button className="text-sm text-gray-600 hover:text-gray-900">
                    Export
                  </button>
                </div>
              </Card>
            ))}
          </div>

          {/* Form Stats */}
          <Card className="mt-8 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Intake Forms</p>
                <p className="text-2xl font-bold text-gray-900">{Object.keys(intakeForms).length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Questions</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Object.values(intakeForms).reduce((total, form) => 
                    total + form.steps.reduce((sum, step) => sum + step.questions.length, 0), 0
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg. Completion Time</p>
                <p className="text-2xl font-bold text-green-600">7-9 min</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Conditions Covered</p>
                <p className="text-2xl font-bold text-purple-600">{Object.keys(intakeForms).length}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Custom Forms */}
      {activeTab === 'custom' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customForms.map((form) => (
            <Card key={form.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{form.name}</h3>
                  <p className="text-sm text-gray-500">{form.category}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  form.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {form.status}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Submissions:</span>
                  <span className="font-medium">{form.submissions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Last Updated:</span>
                  <span className="font-medium">{form.lastUpdated}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex justify-between">
                <button
                  onClick={() => {
                    setEditingCustomForm({
                      id: form.id,
                      name: form.name,
                      category: form.category,
                      status: form.status,
                      description: form.description || '',
                      estimatedTime: form.estimatedTime || '',
                      questions: (form.questions || []).map((q) => ({
                        question: q.question,
                        type: q.type,
                        required: q.required,
                        options: (q.options || []).join(', '),
                      })),
                    });
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Edit
                </button>
                <button
                  onClick={() => { setSelectedCustomForm(form); setShowCustomPreview(true); }}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Preview
                </button>
                <button
                  onClick={() => setDeleteTargetForm(form)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Intake Form Preview Modal */}
      {showPreview && selectedIntakeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{selectedIntakeForm.icon}</span>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedIntakeForm.name}</h3>
                    <p className="text-gray-600">{selectedIntakeForm.estimatedTime}</p>
                  </div>
                </div>
              </div>
              <p className="text-gray-600">{selectedIntakeForm.description}</p>
            </div>

            {/* Step Navigation */}
            <div className="mb-6">
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {selectedIntakeForm.steps.map((step, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPreviewStep(index)}
                    className={`px-4 py-2 text-sm rounded-lg whitespace-nowrap ${
                      currentPreviewStep === index
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {step.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Step */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-4">
                {selectedIntakeForm.steps[currentPreviewStep].title}
              </h4>
              {selectedIntakeForm.steps[currentPreviewStep].subtitle && (
                <p className="text-sm text-gray-600 mb-4">
                  {selectedIntakeForm.steps[currentPreviewStep].subtitle}
                </p>
              )}
              
              <form className="space-y-6">
                {selectedIntakeForm.steps[currentPreviewStep].questions.map((question, index) => (
                  <div key={question.id} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {index + 1}. {question.question}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {question.helpText && (
                      <p className="text-xs text-gray-500">{question.helpText}</p>
                    )}
                    {renderQuestionInput(question)}
                  </div>
                ))}
              </form>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <button
                onClick={() => {
                  if (currentPreviewStep > 0) {
                    setCurrentPreviewStep(currentPreviewStep - 1);
                  }
                }}
                disabled={currentPreviewStep === 0}
                className={`px-4 py-2 rounded-lg ${
                  currentPreviewStep === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                Previous
              </button>
              
              <button
                onClick={() => {
                  setShowPreview(false);
                  setSelectedIntakeForm(null);
                  setCurrentPreviewStep(0);
                }}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Close Preview
              </button>
              
              <button
                onClick={() => {
                  if (currentPreviewStep < selectedIntakeForm.steps.length - 1) {
                    setCurrentPreviewStep(currentPreviewStep + 1);
                  }
                }}
                disabled={currentPreviewStep === selectedIntakeForm.steps.length - 1}
                className={`px-4 py-2 rounded-lg ${
                  currentPreviewStep === selectedIntakeForm.steps.length - 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Custom Form Modal - modeled after Treatment Plans Add Modal */}
      {showFormBuilder && newCustomForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Create Custom Form</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Form Name</label>
                  <input
                    type="text"
                    value={newCustomForm.name}
                    onChange={(e) => setNewCustomForm({ ...newCustomForm, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="e.g., Follow-up Questionnaire"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={newCustomForm.category}
                    onChange={(e) => setNewCustomForm({ ...newCustomForm, category: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    {FORM_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={newCustomForm.status}
                    onChange={(e) => setNewCustomForm({ ...newCustomForm, status: e.target.value as 'active' | 'draft' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estimated Time</label>
                  <input
                    type="text"
                    value={newCustomForm.estimatedTime}
                    onChange={(e) => setNewCustomForm({ ...newCustomForm, estimatedTime: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="e.g., 5-7 min"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={newCustomForm.description}
                  onChange={(e) => setNewCustomForm({ ...newCustomForm, description: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  rows={3}
                  placeholder="Briefly describe this form"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Questions</label>
                <p className="text-xs text-gray-500 mb-3">Add questions for the first step. For select-type questions, separate options with commas.</p>
                {newCustomForm.questions.map((q, index) => (
                  <div key={index} className="border rounded-lg p-3 mb-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Question</label>
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => {
                            const qs = [...newCustomForm.questions];
                            qs[index] = { ...qs[index], question: e.target.value };
                            setNewCustomForm({ ...newCustomForm, questions: qs });
                          }}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Type</label>
                        <select
                          value={q.type}
                          onChange={(e) => {
                            const qs = [...newCustomForm.questions];
                            qs[index] = { ...qs[index], type: e.target.value as IntakeQuestion['type'] };
                            setNewCustomForm({ ...newCustomForm, questions: qs });
                          }}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                          <option value="text">Text</option>
                          <option value="textarea">Textarea</option>
                          <option value="number">Number</option>
                          <option value="select">Select</option>
                          <option value="multiselect">Multi Select</option>
                          <option value="yesno">Yes/No</option>
                          <option value="scale">Scale</option>
                          <option value="date">Date</option>
                        </select>
                      </div>
                    </div>
                    {(q.type === 'select' || q.type === 'multiselect' || q.type === 'scale') && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-700">Options (comma-separated)</label>
                        <input
                          type="text"
                          value={q.options}
                          onChange={(e) => {
                            const qs = [...newCustomForm.questions];
                            qs[index] = { ...qs[index], options: e.target.value };
                            setNewCustomForm({ ...newCustomForm, questions: qs });
                          }}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                          placeholder="e.g., Option A, Option B, Option C"
                        />
                      </div>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <label className="flex items-center text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) => {
                            const qs = [...newCustomForm.questions];
                            qs[index] = { ...qs[index], required: e.target.checked };
                            setNewCustomForm({ ...newCustomForm, questions: qs });
                          }}
                          className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300 rounded mr-2"
                        />
                        Required
                      </label>
                      <button
                        onClick={() => {
                          const qs = newCustomForm.questions.filter((_, i) => i !== index);
                          setNewCustomForm({ ...newCustomForm, questions: qs.length ? qs : [{ question: '', type: 'text', required: false, options: '' }] });
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setNewCustomForm({ ...newCustomForm, questions: [...newCustomForm.questions, { question: '', type: 'text', required: false, options: '' }] })}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  + Add Question
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => { setShowFormBuilder(false); setNewCustomForm(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const id = `custom-${Date.now()}`;
                  const today = new Date();
                  const lastUpdated = today.toISOString().slice(0,10);
                  const parsedQuestions: CustomQuestion[] = newCustomForm.questions.map((q, i) => ({
                    id: `q-${i + 1}`,
                    question: q.question,
                    type: q.type,
                    required: q.required,
                    options:
                      q.type === 'select' || q.type === 'multiselect' || q.type === 'scale'
                        ? q.options.split(',').map((s) => s.trim()).filter(Boolean)
                        : undefined,
                  }));
                  setCustomForms((prev) => [
                    ...prev,
                    {
                      id,
                      name: newCustomForm.name || 'Untitled Form',
                      type: 'custom',
                      category: newCustomForm.category,
                      status: newCustomForm.status,
                      submissions: 0,
                      lastUpdated,
                      description: newCustomForm.description,
                      estimatedTime: newCustomForm.estimatedTime,
                      questions: parsedQuestions,
                    },
                  ]);
                  setShowFormBuilder(false);
                  setNewCustomForm(null);
                  setActiveTab('custom');
                }}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                disabled={!newCustomForm.name}
              >
                Create Form
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Custom Form Modal */}
      {editingCustomForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Edit Form</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Form Name</label>
                  <input
                    type="text"
                    value={editingCustomForm.name}
                    onChange={(e) => setEditingCustomForm({ ...editingCustomForm, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={editingCustomForm.category}
                    onChange={(e) => setEditingCustomForm({ ...editingCustomForm, category: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    {FORM_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={editingCustomForm.status}
                    onChange={(e) => setEditingCustomForm({ ...editingCustomForm, status: e.target.value as 'active' | 'draft' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estimated Time</label>
                  <input
                    type="text"
                    value={editingCustomForm.estimatedTime}
                    onChange={(e) => setEditingCustomForm({ ...editingCustomForm, estimatedTime: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={editingCustomForm.description}
                  onChange={(e) => setEditingCustomForm({ ...editingCustomForm, description: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Questions</label>
                {editingCustomForm.questions.map((q, index) => (
                  <div key={index} className="border rounded-lg p-3 mb-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Question</label>
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => {
                            const qs = [...editingCustomForm.questions];
                            qs[index] = { ...qs[index], question: e.target.value };
                            setEditingCustomForm({ ...editingCustomForm, questions: qs });
                          }}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Type</label>
                        <select
                          value={q.type}
                          onChange={(e) => {
                            const qs = [...editingCustomForm.questions];
                            qs[index] = { ...qs[index], type: e.target.value as IntakeQuestion['type'] };
                            setEditingCustomForm({ ...editingCustomForm, questions: qs });
                          }}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                          <option value="text">Text</option>
                          <option value="textarea">Textarea</option>
                          <option value="number">Number</option>
                          <option value="select">Select</option>
                          <option value="multiselect">Multi Select</option>
                          <option value="yesno">Yes/No</option>
                          <option value="scale">Scale</option>
                          <option value="date">Date</option>
                        </select>
                      </div>
                    </div>
                    {(q.type === 'select' || q.type === 'multiselect' || q.type === 'scale') && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-700">Options (comma-separated)</label>
                        <input
                          type="text"
                          value={q.options}
                          onChange={(e) => {
                            const qs = [...editingCustomForm.questions];
                            qs[index] = { ...qs[index], options: e.target.value };
                            setEditingCustomForm({ ...editingCustomForm, questions: qs });
                          }}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                        />
                      </div>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <label className="flex items-center text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) => {
                            const qs = [...editingCustomForm.questions];
                            qs[index] = { ...qs[index], required: e.target.checked };
                            setEditingCustomForm({ ...editingCustomForm, questions: qs });
                          }}
                          className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300 rounded mr-2"
                        />
                        Required
                      </label>
                      <button
                        onClick={() => {
                          const qs = editingCustomForm.questions.filter((_, i) => i !== index);
                          setEditingCustomForm({ ...editingCustomForm, questions: qs.length ? qs : [{ question: '', type: 'text', required: false, options: '' }] });
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setEditingCustomForm({ ...editingCustomForm, questions: [...editingCustomForm.questions, { question: '', type: 'text', required: false, options: '' }] })}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  + Add Question
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setEditingCustomForm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const lastUpdated = today.toISOString().slice(0,10);
                  const parsedQuestions: CustomQuestion[] = editingCustomForm.questions.map((q, i) => ({
                    id: `q-${i + 1}`,
                    question: q.question,
                    type: q.type,
                    required: q.required,
                    options:
                      q.type === 'select' || q.type === 'multiselect' || q.type === 'scale'
                        ? q.options.split(',').map((s) => s.trim()).filter(Boolean)
                        : undefined,
                  }));
                  setCustomForms((prev) => prev.map((f) => f.id === editingCustomForm.id
                    ? { ...f,
                        name: editingCustomForm.name,
                        category: editingCustomForm.category,
                        status: editingCustomForm.status,
                        description: editingCustomForm.description,
                        estimatedTime: editingCustomForm.estimatedTime,
                        questions: parsedQuestions,
                        lastUpdated,
                      }
                    : f
                  ));
                  setEditingCustomForm(null);
                }}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Form Preview Modal */}
      {showCustomPreview && selectedCustomForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900">{selectedCustomForm.name}</h3>
              {(selectedCustomForm.estimatedTime || selectedCustomForm.description) && (
                <p className="text-gray-600 mt-1">{selectedCustomForm.estimatedTime} {selectedCustomForm.description ? `• ${selectedCustomForm.description}` : ''}</p>
              )}
            </div>
            <form className="space-y-6">
              {selectedCustomForm.questions && selectedCustomForm.questions.length > 0 ? (
                selectedCustomForm.questions.map((question, index) => (
                  <div key={question.id} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {index + 1}. {question.question}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderQuestionInput(question as unknown as IntakeQuestion)}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">No questions defined for this form.</p>
              )}
            </form>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => { setShowCustomPreview(false); setSelectedCustomForm(null); }}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900">Delete Form</h3>
            <p className="text-sm text-gray-600 mt-2">
              Are you sure you want to delete "{deleteTargetForm.name}"? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setDeleteTargetForm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setCustomForms((prev) => prev.filter((f) => f.id !== deleteTargetForm.id));
                  setDeleteTargetForm(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
