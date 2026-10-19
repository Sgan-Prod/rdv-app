import RefTable from './RefTable'

function Parametres() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <RefTable table="statuts" column="libelle" titre="Statuts" />
      <RefTable table="moyens_paiement" column="libelle" titre="Moyens de paiement" />
    </div>
  )
}

export default Parametres