import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useBuyerContacts, useCreateContact, useDeleteContact } from '../../../../services/buyer/hooks';
import { ErrorState, LoadingState } from '../../../../components/ui/PageStates';
import { SelectInput, TextInput } from '../../../../components/forms/FormFields';
import { Button } from '../../../../components/ui/Button';
import { SecurityFooter } from '../../../../components/BaseComponents/Header';
import { ContactForm, contactSchema } from '../../../../domain/validation/schemas';

const emptyContact = { fullName: '', designation: '', department: '', email: '', mobile: '', alternateMobile: '', decisionRole: '', communication: ['Email'], consent: true as const };

export default function ContactPage() {
  const contactsQuery = useBuyerContacts();
  const createContact = useCreateContact();
  const deleteContact = useDeleteContact();
  const nav = useNavigate();
  const loc = useLocation();
  const isFromSettings = loc.search.includes('from=settings');

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: emptyContact
  });

  if (contactsQuery.isLoading) return <LoadingState/>;
  if (contactsQuery.isError) return <ErrorState error={contactsQuery.error} retry={() => contactsQuery.refetch()}/>;

  const existingContacts = contactsQuery.data || [];

  return (
    <div className="card mx-auto max-w-5xl p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          {!isFromSettings && <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-600">Buyer Journey — Screen 4</p>}
          <h1 className="text-xl font-extrabold">{isFromSettings ? 'Manage Contacts' : 'Buyer Contact Person'}</h1>
          <p className="text-xs text-slate-500">Add one or more contacts for all commercial activities in this account.</p>
        </div>
      </div>

      {existingContacts.length > 0 && (
        <div className="mb-8 space-y-4">
          <h2 className="text-sm font-bold text-slate-700">Existing Contacts</h2>
          {existingContacts.map((contact: any) => (
            <div key={contact.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="font-bold text-slate-800">{contact.fullName} {contact.isPrimary && <span className="ml-2 rounded bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">Primary</span>}</p>
                <p className="mt-1 text-xs text-slate-500">{contact.designation} • {contact.email} • {contact.mobile}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this contact?')) {
                    deleteContact.mutate(contact.id);
                  }
                }}
                disabled={deleteContact.isPending}
                className="flex cursor-pointer items-center gap-1 rounded border border-red-200 bg-white px-3 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5"/> Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={handleSubmit((d) => {
          createContact.mutate(d, {
            onSuccess: () => {
              reset(emptyContact);
            }
          });
        })}
      >
        <fieldset className="rounded-2xl border border-slate-200 p-5">
          <legend className="px-1 text-xs font-extrabold text-slate-700">Add New Contact</legend>
          
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <TextInput label="Full Name" required {...register('fullName')} error={errors.fullName}/>
            <TextInput label="Designation" required {...register('designation')} error={errors.designation}/>
            <SelectInput label="Department" required {...register('department')} error={errors.department}>
              <option value="">Select</option>
              <option>Procurement</option>
              <option>Strategic Sourcing</option>
              <option>Engineering</option>
              <option>Quality</option>
            </SelectInput>
            <TextInput label="Email Address" type="email" required {...register('email')} error={errors.email}/>
            <TextInput label="Phone Number" required {...register('mobile')} error={errors.mobile}/>
            <TextInput label="Alternate Mobile" {...register('alternateMobile')} error={errors.alternateMobile}/>
            <SelectInput label="Decision Role" required {...register('decisionRole')} error={errors.decisionRole}>
              <option value="">Select</option>
              <option>Final Decision Maker</option>
              <option>Recommender / Influencer</option>
              <option>Evaluator</option>
              <option>Other</option>
            </SelectInput>
          </div>

          <fieldset className="mt-5 rounded-xl border border-slate-200 p-4">
            <legend className="px-1 text-xs font-extrabold text-slate-700">Communication Preferences</legend>
            <div className="flex flex-wrap gap-5 text-xs">
              {['Email', 'SMS', 'WhatsApp'].map((x) => (
                <label className="flex items-center gap-2" key={x}>
                  <input type="checkbox" value={x} {...register('communication')}/>{x}
                </label>
              ))}
            </div>
            {errors.communication && <p className="mt-2 text-xs text-red-600">{errors.communication.message}</p>}
          </fieldset>

          <label className="mt-4 flex items-start gap-2 text-xs text-slate-600">
            <input type="checkbox" {...register('consent')} className="mt-0.5"/>
            I confirm that this contact is authorised to participate in Buyer-Seller activities for this organisation.
          </label>
          {errors.consent && <p className="mt-1 text-xs text-red-600">Consent is required.</p>}

          <div className="mt-5 flex justify-end">
            <Button type="submit" loading={createContact.isPending}>Add Contact</Button>
          </div>
        </fieldset>
      </form>

      <div className="mt-6 flex justify-between">
        <Button variant="secondary" type="button" onClick={() => nav(isFromSettings ? '/buyer/settings' : '/buyer/onboarding/organisation')}>← Back</Button>
        <div className="flex gap-2">
          <Button 
            type="button" 
            onClick={() => {
              if (existingContacts.length === 0) {
                alert('Please add at least one contact before continuing.');
                return;
              }
              if (isFromSettings) {
                alert('Contacts updated successfully.');
                nav('/buyer/settings');
              } else {
                nav('/buyer/requirements/new/basic');
              }
            }}
          >
            {isFromSettings ? 'Done' : 'Next →'}
          </Button>
        </div>
      </div>
      <SecurityFooter/>
    </div>
  );
}