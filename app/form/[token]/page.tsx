import ProductionForm from "../../production-form";
export default async function FormPage({params}:{params:Promise<{token:string}>}){const {token}=await params;return <ProductionForm token={token}/>}