import { zodResolver } from '@hookform/resolvers/zod'; import { useForm } from 'react-hook-form'; import { useNavigate, useLocation } from 'react-router-dom'; import { Building2,ShieldCheck } from 'lucide-react';
import { SecurityFooter } from '../../../../components/BaseComponents/Header';
import { TextInput, SelectInput, TextAreaInput } from '../../../../components/forms/FormFields';
import { Button } from '../../../../components/ui/Button';
import { LoadingState, ErrorState } from '../../../../components/ui/PageStates';
import { OrganisationForm, organisationSchema } from '../../../../domain/validation/schemas';
import { useBuyerOrganisation, useSaveDraft } from '../../../../services/buyer/hooks';

const opts={org:['Private Limited Company','Public Limited Company','LLP','Partnership','Proprietorship','Government / PSU'],industry:['Automotive','Aerospace & Defence','Engineering','Electronics','Fabrication','Plastics'],state:['Tamil Nadu','Karnataka','Maharashtra','Telangana','Other'],employees:['1 - 50','51 - 100','101 - 500','501 - 1000','1000+'],turnover:['< ₹5 Crore','₹5 - 25 Crore','₹25 - 100 Crore','₹100 - 500 Crore','₹500 Crore+']};
export default function OrganisationPage(){
  const q=useBuyerOrganisation();
  const nav=useNavigate();
  const loc = useLocation();
  const isFromSettings = loc.search.includes('from=settings');
  const save=useSaveDraft('organisation');
  const {register,handleSubmit,formState:{errors,isDirty}}=useForm<OrganisationForm>({
    // @ts-ignore
    resolver:zodResolver(organisationSchema),
    values:q.data?{...q.data,gstin:q.data.gstin??'',pan:q.data.pan??'',website:q.data.website??''}:undefined,
    defaultValues:{country:'India'}
  });
  
  if(q.isLoading)return <LoadingState label="Loading Buyer organisation…"/>;
  if(q.isError)return <ErrorState error={q.error} retry={()=>q.refetch()}/>;
  
  const submit=handleSubmit(async data=>{
    await save.mutateAsync({payload:data,version:q.data?.version});
    if (isFromSettings) {
      alert("Organisation Profile updated successfully.");
      nav('/buyer/settings');
    } else {
      nav('/buyer/onboarding/contact');
    }
  });

  return <div className="grid gap-5 lg:grid-cols-[16rem_minmax(0,1fr)]">
    <aside className="card h-fit p-5">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Building2 className="h-7 w-7"/></div>
      <h2 className="mt-4 font-extrabold">{isFromSettings ? 'Update your organisation' : 'Register your organisation'}</h2>
      <p className="mt-2 text-xs leading-5 text-slate-500">Use legal and statutory information for your Buyer organisation. No Buyer data is mapped to Visitor records.</p>
      <div className="mt-5 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800"><ShieldCheck className="mb-2 h-4 w-4"/>Verified identifiers remain subject to server validation.</div>
    </aside>
    <form onSubmit={submit} className="card p-5 md:p-6">
      <div className="mb-5">
        {!isFromSettings && <p className="text-[10px] font-extrabold uppercase tracking-wider text-brand-600">Buyer Journey — Screen 3</p>}
        <h1 className="mt-1 text-xl font-extrabold">{isFromSettings ? 'Organisation Profile' : 'Create your Organisation Profile'}</h1>
        <p className="mt-1 text-xs text-slate-500">Legal entity and registered-office information.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <TextInput label="Legal Name of Organisation" required {...register('legalName')} error={errors.legalName}/>
        <TextInput label="GSTIN" {...register('gstin')} error={errors.gstin} helperText="Required for Indian GST-registered organisations."/>
        <TextInput label="PAN" {...register('pan')} error={errors.pan}/>
        <SelectInput label="Organisation Type" required {...register('organisationType')} error={errors.organisationType}><option value="">Select</option>{opts.org.map(x=><option key={x}>{x}</option>)}</SelectInput>
        <SelectInput label="Industry" required {...register('industry')} error={errors.industry}><option value="">Select</option>{opts.industry.map(x=><option key={x}>{x}</option>)}</SelectInput>
        <TextInput label="Company Website" {...register('website')} error={errors.website}/>
        <TextInput label="Year of Establishment" type="number" required {...register('establishmentYear')} error={errors.establishmentYear}/>
        <SelectInput label="Total Number of Employees" required {...register('employeeBand')} error={errors.employeeBand}><option value="">Select</option>{opts.employees.map(x=><option key={x}>{x}</option>)}</SelectInput>
        <SelectInput label="Annual Turnover" required {...register('turnoverBand')} error={errors.turnoverBand}><option value="">Select</option>{opts.turnover.map(x=><option key={x}>{x}</option>)}</SelectInput>
      </div>
      <div className="mt-4"><TextAreaInput label="Registered Office Address" required rows={2} {...register('registeredAddress')} error={errors.registeredAddress}/></div>
      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <TextInput label="City" required {...register('city')} error={errors.city}/>
        <SelectInput label="State" required {...register('state')} error={errors.state}><option value="">Select</option>{opts.state.map(x=><option key={x}>{x}</option>)}</SelectInput>
        <TextInput label="PIN / Postal Code" required {...register('postalCode')} error={errors.postalCode}/>
        <TextInput label="Country" required {...register('country')} error={errors.country}/>
      </div>
      {save.isError&&<div className="mt-4"><ErrorState error={save.error}/></div>}
      <div className="mt-6 flex items-center justify-between">
        <Button variant="secondary" type="button" onClick={()=> isFromSettings ? nav('/buyer/settings') : nav('/role-selection')}>← Back</Button>
        <div className="flex gap-2">
          {!isFromSettings && <Button variant="secondary" type="button" disabled={!isDirty} onClick={handleSubmit(data=>save.mutate({payload:data,version:q.data?.version}))}>Save as Draft</Button>}
          <Button type="submit" loading={save.isPending}>{isFromSettings ? 'Save Changes' : 'Save & Continue →'}</Button>
        </div>
      </div>
      <SecurityFooter/>
    </form>
  </div>;
}
