"use client";
import ConsentForm from "./consent-form";
export default function ProductionForm({token}:{token:string}) {return <ConsentForm formal token={token} home={()=>window.location.assign("/")}/>;}
