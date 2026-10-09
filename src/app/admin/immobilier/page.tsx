import type { Metadata } from 'next';
import { EstateAdmin } from '@/components/EstateAdmin';
export const metadata: Metadata = {title:'Administration immobilière',robots:{index:false,follow:false}};
export default function EstateAdminPage(){return <EstateAdmin/>;}
