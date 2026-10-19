import RefTable from './RefTable'

function Etablissements() {
  return (
    <div className="mx-auto max-w-xl">
      <RefTable table="etablissements" column="nom" titre="Établissements" />
    </div>
  )
}

export default Etablissements