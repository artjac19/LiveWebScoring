Imports System.Web
Imports System.Web.UI
Imports System.Security.Cryptography.X509Certificates
Imports System.Text.RegularExpressions

Public Class TDetails
    Inherits System.Web.UI.Page

    Protected Sub Page_Load(sender As Object, e As EventArgs) Handles Me.Load
        Try
            ' Clear any existing response
            Response.Clear()
            Response.ContentType = "application/json"

            ' Get and validate sanction ID from query string
            Dim sanctionId As String = Request.QueryString("sid")

            ' Validate sanction ID
            If String.IsNullOrEmpty(sanctionId) OrElse Not Regex.IsMatch(sanctionId, "^[0-9][0-9][CEMSWUX][0-9][0-9][0-9]$") Then
                Response.Write("{""Success"":false,""ErrorMessage"":""Invalid or missing sanction ID""}")
                Return
            End If

            ' Get officials data
            Dim sArrOfficials = ModDataAccess3.GetOfficials(sanctionId)

            ' Get tournament details (specs)
            Dim sArrSpecs = ModDataAccess3.GetTournamentSpecs(sanctionId)
            ' Log the raw specs array to Visual Studio Output window for debugging
            System.Diagnostics.Debug.WriteLine("GetTournamentSpecs returned type: " & If(sArrSpecs Is Nothing, "Nothing", sArrSpecs.GetType().FullName))
            If sArrSpecs IsNot Nothing Then
                System.Diagnostics.Debug.WriteLine("sArrSpecs.GetLength(0): " & sArrSpecs.GetLength(0).ToString())
                System.Diagnostics.Debug.WriteLine("sArrSpecs.GetLength(1): " & sArrSpecs.GetLength(1).ToString())
                For i As Integer = 0 To sArrSpecs.GetLength(0) - 1
                    Dim rowLog As String = "Spec Row " & i.ToString() & ":"
                    For j As Integer = 0 To sArrSpecs.GetLength(1) - 1
                        Dim val As Object = sArrSpecs(i, j)
                        If val Is Nothing Then
                            rowLog &= " [" & j & "]=NULL;"
                        Else
                            rowLog &= " [" & j & "]=""" & val.ToString() & """;"
                        End If
                    Next
                    System.Diagnostics.Debug.WriteLine(rowLog)
                Next
            End If

            ' Get active event(s) string
            Dim activeEvent As String = ModDataAccess3.GetCurrentEvent(sanctionId, -15)
            If activeEvent Is Nothing Then activeEvent = ""
            ' Start building JSON response with ActiveEvent
            Dim jsSerializer As New System.Web.Script.Serialization.JavaScriptSerializer()
            Response.Write("{""Success"":true,""ActiveEvent"":" & jsSerializer.Serialize(activeEvent) & ",""Officials"":[")

            Dim firstOfficialAdded As Boolean = False

            ' Process officials
            If sArrOfficials IsNot Nothing Then
                If Left(sArrOfficials(0, 0), 5) <> "Error" Then
                    For i As Integer = 0 To UBound(sArrOfficials, 1)
                        Dim roleObj = sArrOfficials(i, 1)
                        Dim nameObj = sArrOfficials(i, 2)

                        Try
                            If roleObj IsNot Nothing AndAlso nameObj IsNot Nothing Then
                                Dim role As String = If(roleObj IsNot Nothing, roleObj.ToString(), "")
                                Dim name As String = If(nameObj IsNot Nothing, nameObj.ToString(), "")
                                Dim lastName As String = ""
                                Dim firstName As String = ""
                                Dim commaIdx As Integer = name.IndexOf(",")
                                If commaIdx > -1 Then
                                    lastName = name.Substring(0, commaIdx).Trim()
                                    firstName = name.Substring(commaIdx + 1).Trim()
                                Else
                                    lastName = name
                                End If

                                If firstOfficialAdded Then
                                    Response.Write(",")
                                End If
                                Response.Write("{")
                                Response.Write("""Role"":""" & role & """,")
                                Response.Write("""FirstName"":""" & firstName & """,")
                                Response.Write("""LastName"":""" & lastName & """}")
                                firstOfficialAdded = True
                            End If
                        Catch exOfficial As Exception
                            System.Diagnostics.Debug.WriteLine("Officials output error: " & exOfficial.ToString())
                            If firstOfficialAdded Then Response.Write(",")
                            Response.Write("{" & Chr(34) & "Role" & Chr(34) & ":" & Chr(34) & "ERROR" & Chr(34) & "," & Chr(34) & "FirstName" & Chr(34) & ":" & Chr(34) & "" & Chr(34) & "," & Chr(34) & "LastName" & Chr(34) & ":" & Chr(34) & "" & Chr(34) & "}")
                            firstOfficialAdded = True
                        End Try
                    Next
                End If

                ' Close JSON array
                Response.Write("]")
            End If

            ' For debugging: Output raw tournament details in the JSON response
            Response.Write("," & Chr(34) & "RawSpecs" & Chr(34) & ": [")
            Dim wroteSpecRow As Boolean = False
            ' Output only rows 1-8, columns 1 and 2, as [label, value] pairs
            For i As Integer = 1 To 8
                Dim label As Object = sArrSpecs(i, 1)
                Dim value As Object = sArrSpecs(i, 2)
                If (label IsNot Nothing AndAlso label.ToString() <> "") OrElse (value IsNot Nothing AndAlso value.ToString() <> "") Then
                    If wroteSpecRow Then Response.Write(",")
                    Response.Write("[")
                    ' Output label
                    If label Is Nothing OrElse label Is DBNull.Value Then
                        Response.Write("null")
                    Else
                        Response.Write("""" & CStr(label) & """")
                    End If
                    Response.Write(",")
                    ' Output value
                    If value Is Nothing OrElse value Is DBNull.Value Then
                        Response.Write("null")
                    Else
                        Response.Write("""" & CStr(value) & """")
                    End If
                    Response.Write("]")
                    wroteSpecRow = True
                End If
            Next
            Response.Write("]")
            ' Add Teams data to JSON response
            Response.Write("," & Chr(34) & "Teams" & Chr(34) & ": [")
            
            ' Get and process teams data
            Dim teamsData As String = ModDataAccess3.GetTeams(sanctionId)
            
            ' Log teams data for debugging
            System.Diagnostics.Debug.WriteLine("Raw teams data: " & If(teamsData Is Nothing, "NULL", teamsData))
            
            Dim firstTeamAdded As Boolean = False
            
            ' Only process if we have valid team data
            If teamsData IsNot Nothing AndAlso Not teamsData.StartsWith("Error") AndAlso teamsData.Trim() <> "" Then
                ' Split teams data by line breaks - handle different line break formats
                Dim teams As String() = teamsData.Split(New String() {Environment.NewLine, "\r\n", "\n", "\r"}, StringSplitOptions.RemoveEmptyEntries)
                
                ' Log how many teams were found
                System.Diagnostics.Debug.WriteLine("Number of teams found: " & teams.Length)
                
                ' Process each team
                For Each team As String In teams
                    If team IsNot Nothing AndAlso team.Trim() <> "" Then
                        ' Log each team being added
                        System.Diagnostics.Debug.WriteLine("Adding team: " & team.Trim())
                        
                        ' Add comma if not the first team
                        If firstTeamAdded Then Response.Write(",")
                        
                        ' Format as a JSON object with Name property - escape any special chars in team name
                        Dim escapedTeam As String = team.Trim().Replace("\", """\").Replace("\r", "").Replace("\n", " ")
                        Response.Write("{" & Chr(34) & "Name" & Chr(34) & ":" & Chr(34) & escapedTeam & Chr(34) & "}")
                        firstTeamAdded = True
                    End If
                Next
            Else
                ' Log why no teams were processed
                If teamsData Is Nothing Then
                    System.Diagnostics.Debug.WriteLine("Teams data is NULL")
                ElseIf teamsData.StartsWith("Error") Then
                    System.Diagnostics.Debug.WriteLine("Teams data has error: " & teamsData)
                ElseIf teamsData.Trim() = "" Then
                    System.Diagnostics.Debug.WriteLine("Teams data is empty string")
                End If
            End If
            
            Response.Write("]")
            System.Diagnostics.Debug.WriteLine("Teams JSON array completed")
            
            ' Close the JSON object
            Response.Write("}")

        Catch ex As Exception
            ' Log error, but do not write a new JSON object if output has started
            System.Diagnostics.Debug.WriteLine("TDetails.aspx.vb error: " & ex.ToString())
            ' Optionally: If you want to signal an error in the JSON, you could close the JSON object if possible
        End Try
        Try
            Response.End()
        Catch exThreadAbort As Threading.ThreadAbortException
            ' Suppress ThreadAbortException thrown by Response.End()
        End Try
    End Sub
End Class